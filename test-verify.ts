import { db } from './server/db/index.js';
import { users, roles, departments } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const decodedToken = { uid: 'mock-uid-Y2hyaXN0aWFuZWthcmVsQGdtYWlsLmNvbQ', email: 'christianekarel@gmail.com' };
  
  let result = await db.select({
      user: users,
      role: roles,
      department: departments
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(users.firebaseUid, decodedToken.uid))
    .limit(1);

  if (!result.length && decodedToken.email) {
      const emailResult = await db.select({
        user: users,
        role: roles,
        department: departments
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(eq(users.email, decodedToken.email))
      .limit(1);
      
      console.log("Email result:", emailResult.length > 0 ? "Found" : "Not Found");

      if (emailResult.length) {
        try {
          await db.update(users)
            .set({ firebaseUid: decodedToken.uid })
            .where(eq(users.id, emailResult[0].user.id));
          result = emailResult;
          console.log(`Linked existing user`);
        } catch (err) {
          console.error("Update failed", err);
        }
      }
  }

  console.log("Final result length:", result.length);
  process.exit(0);
}
run().catch(console.error);
