import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, roles, departments, auditLogs, departmentAssignmentHistory } from '../db/schema.js';
import { eq, aliasedTable } from 'drizzle-orm';
import { logAudit } from '../services/audit.js';
import { auth } from '../firebase.js';

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser.id;
    const managers = aliasedTable(users, 'managers');
    
    const result = await db.select({
      id: users.id,
      firebaseUid: users.firebaseUid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      employeeNumber: users.employeeNumber,
      jobTitle: users.jobTitle,
      profilePhotoUrl: users.profilePhotoUrl,
      status: users.status,
      onboardingComplete: users.onboardingComplete,
      onboardingCompletedAt: users.onboardingCompletedAt,
      dateJoinedDepartment: users.dateJoinedDepartment,
      lastDepartmentChangeAt: users.lastDepartmentChangeAt,
      role: roles.name,
      department: departments.name,
      managerFirstName: managers.firstName,
      managerLastName: managers.lastName
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .leftJoin(managers, eq(users.managerId, managers.id))
    .where(eq(users.id, userId))
    .limit(1);

    if (!result.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const loginSuccess = async (req: Request, res: Response) => {
  try {
    const { loginMethod } = req.body; // 'GOOGLE' or 'EMAIL'
    
    // Auth is verified by verifyToken middleware
    const userId = req.dbUser.id;
    
    // Set Custom Claims (Role + Dept)
    if (auth && req.user.uid) {
      const claims = {
        role: req.role.name,
        departmentId: req.dbUser.departmentId
      };
      await auth.setCustomUserClaims(req.user.uid, claims);
    }
    
    // Log success
    const action = loginMethod === 'GOOGLE' ? 'GOOGLE_LOGIN' : 'LOGIN_SUCCESS';
    await logAudit(userId, action, req.ip, { userAgent: req.headers['user-agent'] });
    
    res.json({ success: true, message: 'Login recorded' });
  } catch (err) {
    console.error('Error in login record:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await logAudit(req.dbUser?.id || null, 'LOGOUT', req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    let list = await db.select().from(departments);
    
    // If empty, auto-seed standard Movit Group departments to ensure dropdown has options
    if (list.length === 0) {
      const standardDepts = [
        'Sales',
        'Distribution',
        'Marketing',
        'Manufacturing',
        'Finance',
        'Human Resources',
        'ICT',
        'Procurement',
        'Logistics',
        'Quality Assurance'
      ];
      
      for (const deptName of standardDepts) {
        await db.insert(departments).values({ name: deptName }).onConflictDoNothing();
      }
      list = await db.select().from(departments);
    }
    
    res.json(list);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const getSupervisors = async (req: Request, res: Response) => {
  try {
    // Ensure standard supervisors exist
    let supervisorRole = await db.select().from(roles).where(eq(roles.name, 'Supervisor')).limit(1);
    if (!supervisorRole.length) {
      const newRole = await db.insert(roles).values({ name: 'Supervisor', permissions: { viewReports: true, createTasks: true } }).returning();
      supervisorRole = newRole;
    }

    const allDepts = await db.select().from(departments);
    
    // Default supervisors to seed
    const defaultSups = [
      { firstName: 'Samuel', lastName: 'Okello', email: 'samuel.okello@movitgroup.internal', jobTitle: 'Regional Supervisor', deptName: 'Sales' },
      { firstName: 'John', lastName: 'Kato', email: 'john.kato@movitgroup.internal', jobTitle: 'Distribution Manager', deptName: 'Distribution' },
      { firstName: 'Emmy', lastName: 'Musasizi', email: 'emmy.musasizi@movitgroup.com', jobTitle: 'Head of Marketing', deptName: 'Marketing' },
      { firstName: 'Bruce', lastName: 'Mpamizo', email: 'bruce.mpamizo@movitgroup.com', jobTitle: 'Executive Director', deptName: 'Manufacturing' },
      { firstName: 'Adard', lastName: 'Mukiibi', email: 'adard.mukiibi@movitgroup.com', jobTitle: 'Chief Financial Officer', deptName: 'Finance' },
      { firstName: 'Allen', lastName: 'Ayebare', email: 'allen.ayebare@movitgroup.com', jobTitle: 'Head of Human Resources', deptName: 'Human Resources' },
      { firstName: 'Anthony', lastName: 'Okello', email: 'anthony.okello@movitgroup.com', jobTitle: 'Head of IT', deptName: 'ICT' },
      { firstName: 'Grace', lastName: 'Nabassa', email: 'grace.nabassa@movitgroup.com', jobTitle: 'Procurement Director', deptName: 'Procurement' },
      { firstName: 'Patrick', lastName: 'Ssewankambo', email: 'patrick.ssewankambo@movitgroup.com', jobTitle: 'Logistics Manager', deptName: 'Logistics' },
      { firstName: 'Joseph', lastName: 'Ssepuuya', email: 'joseph.ssepuuya@movitgroup.com', jobTitle: 'Head of Quality Assurance', deptName: 'Quality Assurance' }
    ];

    for (const sup of defaultSups) {
      const deptObj = allDepts.find(d => d.name.toLowerCase() === sup.deptName.toLowerCase());
      if (deptObj) {
        // Check if user exists
        const exists = await db.select().from(users).where(eq(users.email, sup.email)).limit(1);
        if (!exists.length) {
          await db.insert(users).values({
            firebaseUid: `mock_${sup.firstName.toLowerCase()}_uid`,
            firstName: sup.firstName,
            lastName: sup.lastName,
            email: sup.email,
            jobTitle: sup.jobTitle,
            roleId: supervisorRole[0].id,
            departmentId: deptObj.id,
            status: 'ACTIVE',
            onboardingComplete: true
          });
        }
      }
    }

    // Now return registered employees whom someone can report to (Active status)
    const list = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      jobTitle: users.jobTitle,
      departmentId: users.departmentId,
      roleName: roles.name
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.status, 'ACTIVE'));
    
    res.json(list);
  } catch (err) {
    console.error('Error fetching supervisors:', err);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      employeeNumber, 
      department, // String name fallback
      departmentId, // Selected UUID
      managerId, // Selected direct supervisor UUID
      jobTitle, 
      organization 
    } = req.body;
    
    const { uid, email } = req.user;
    
    // 1. Permanently restrict elevated roles on registration: ALWAYS assign 'Field Staff'
    let targetRole = await db.select().from(roles).where(eq(roles.name, 'Field Staff')).limit(1);
    
    if (!targetRole.length) {
      const newRole = await db.insert(roles).values({ name: 'Field Staff', permissions: { createReports: true } }).returning();
      targetRole = newRole;
    }

    // 2. Resolve department
    let assignedDepartmentId = departmentId || null;
    if (!assignedDepartmentId && department) {
      let deptResult = await db.select().from(departments).where(eq(departments.name, department)).limit(1);
      if (!deptResult.length) {
         const newDept = await db.insert(departments).values({ name: department }).returning();
         deptResult = newDept;
      }
      assignedDepartmentId = deptResult[0].id;
    }

    // 3. Status is ACTIVE (No approval required)
    const status = 'ACTIVE';

    const now = new Date();
    const newUser = await db.insert(users).values({
      firebaseUid: uid,
      email: email || '',
      firstName,
      lastName,
      phone,
      employeeNumber: employeeNumber || null,
      departmentId: assignedDepartmentId,
      managerId: managerId || null,
      jobTitle: jobTitle || 'Employee',
      roleId: targetRole[0].id,
      status: status,
      onboardingComplete: true,
      onboardingCompletedAt: now,
      dateJoinedDepartment: now
    }).returning();

    await logAudit(newUser[0].id, 'ACCOUNT_CREATED', req.ip, { 
      organization, 
      departmentId: assignedDepartmentId, 
      managerId, 
      jobTitle,
      status, 
      userAgent: req.headers['user-agent'] 
    });

    await logAudit(newUser[0].id, 'USER_ONBOARDING_COMPLETED', req.ip, {
      completedAt: now,
      departmentId: assignedDepartmentId
    });

    if (assignedDepartmentId) {
      await db.insert(departmentAssignmentHistory).values({
        userId: newUser[0].id,
        previousDepartmentId: null,
        newDepartmentId: assignedDepartmentId,
        assignedBy: newUser[0].id,
        assignmentReason: 'Onboarding self-enrollment',
        effectiveDate: now,
        createdAt: now
      });
    }
    
    res.json({ success: true, user: newUser[0] });
  } catch (err: any) {
    console.error('Error in registration:', err);
    if (err.code === '23505' || err.message?.includes('unique constraint')) {
      return res.status(400).json({ error: 'A user with this employee number, phone, or email already exists.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const publicAuditLogAction = async (req: Request, res: Response) => {
  try {
    const { action, metadata } = req.body;
    await logAudit(null, action, req.ip, metadata);
    res.json({ success: true });
  } catch (err) {
    console.error('Error logging public audit action:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const auditLogAction = async (req: Request, res: Response) => {
  try {
    const { action, metadata } = req.body;
    let userId = null;
    
    // Optionally link to DB user if they exist
    if (req.user?.uid) {
       const userResult = await db.select().from(users).where(eq(users.firebaseUid, req.user.uid)).limit(1);
       if (userResult.length) userId = userResult[0].id;
    }
    
    await logAudit(userId, action, req.ip, metadata);
    res.json({ success: true });
  } catch (err) {
    console.error('Error logging audit action:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
