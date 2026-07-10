import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  BarChart3,
  Users,
  Target,
  Award,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Building2,
  Newspaper,
  LayoutDashboard,
  Box,
  Truck,
  ShieldCheck
} from 'lucide-react';

export default function Home() {
  const { currentUser } = useAuth();
  
  const [content, setContent] = useState({
    heroHeadline: 'Welcome to Supervisor Eye',
    heroSubheadline: "Movit Group's Intelligent Workforce Supervision, Reporting and Performance Management Platform. Command operations, ensure quality, and drive excellence across all regions.",
    companyOverview: 'Empowering personal care through manufacturing excellence and continuous innovation since 1997.'
  });

  useEffect(() => {
    // Make public call to get custom homepage data if it exists
    fetch('/api/v1/public/homepage')
      .then(r => r.json())
      .then(data => {
        if (data && data.heroHeadline) {
           setContent(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Supervisor Eye" className="h-12 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#spotlight" className="hover:text-pink-600 transition-colors">Company</a>
            <a href="#products" className="hover:text-pink-600 transition-colors">Products</a>
            <a href="#news" className="hover:text-pink-600 transition-colors">News</a>
            <a href="#departments" className="hover:text-pink-600 transition-colors">Departments</a>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
              >
                ACCESS DASHBOARD <LayoutDashboard className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
              >
                EMPLOYEE LOGIN <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000"
            alt="Manufacturing Facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold mb-6 tracking-wider uppercase">
              Official Internal Portal
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              {content.heroHeadline}
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed font-light">
              {content.heroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 text-lg"
                >
                  Access Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-8 py-4 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 text-lg"
                >
                  Sign In to Enterprise <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <a
                href="#news"
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg"
              >
                View Latest Communications
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MOVIT COMPANY SPOTLIGHT */}
      <section id="spotlight" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">About Movit Group</h2>
            <p className="text-slate-600 mt-2 text-lg mb-8">
              {content.companyOverview}
            </p>
            <a 
              href="https://movitproducts.com/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors border border-slate-200"
            >
              Learn More About Movit <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                To enhance daily lives by delivering quality personal care products that inspire confidence and beauty across the continent.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                To be the most preferred personal care brand in Africa, driven by operational excellence and a passionate workforce.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Core Values</h3>
              <p className="text-slate-600 leading-relaxed">
                Quality, Integrity, Teamwork, and Innovation form the foundation of our manufacturing and corporate operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOVIT PRODUCT SHOWCASE */}
      <section id="products" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-black mb-4">Our Core Product Portfolio</h2>
              <p className="text-slate-400 max-w-2xl text-lg">
                The leading brands we manufacture, distribute, and track performance against every single day.
              </p>
            </div>
            <a 
              href="https://movitproducts.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 font-bold hover:text-pink-300 flex items-center gap-1 group"
            >
              View More Products <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Hair Care Division", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=800", desc: "Movit Hair Care, Radiant, and professional salon lines." },
              { name: "Body & Skin Care", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800", desc: "Lotions, creams, and skin barrier protection products." },
              { name: "Personal Hygiene", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800", desc: "Skin Guard soaps, hand washes, and sanitization." }
            ].map((prod, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-800">
                <img src={prod.image} alt={prod.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <h3 className="text-2xl font-bold mb-2">{prod.name}</h3>
                  <p className="text-slate-300 text-sm">{prod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CORPORATE PERFORMANCE SNAPSHOT */}
      <section className="py-12 bg-pink-600 my-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-pink-500">
            <div className="px-6 text-center">
              <div className="text-4xl font-black text-white mb-1">2,400+</div>
              <div className="text-pink-200 font-medium">Active Employees</div>
            </div>
            <div className="px-6 text-center">
              <div className="text-4xl font-black text-white mb-1">15K+</div>
              <div className="text-pink-200 font-medium">Field Reports Submitted</div>
            </div>
            <div className="px-6 text-center">
              <div className="text-4xl font-black text-white mb-1">98.5%</div>
              <div className="text-pink-200 font-medium">Quality Compliance</div>
            </div>
            <div className="px-6 text-center">
              <div className="text-4xl font-black text-white mb-1">8</div>
              <div className="text-pink-200 font-medium">Regional Operations</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPANY NEWS & ANNOUNCEMENTS */}
      <section id="news" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-12">
            <Newspaper className="w-6 h-6 text-pink-600" />
            <h2 className="text-2xl font-black text-slate-900">Corporate Communications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { type: "Announcement", date: "Today, 08:00 AM", title: "Q3 Manufacturing Targets Exceeded", snippet: "Congratulations to the production floor. The latest metrics show..." },
              { type: "Notice", date: "Yesterday, 14:30 PM", title: "Updated Distribution Protocols", snippet: "All logistics coordinators must review the revised routing system via the dashboard." },
              { type: "Product Launch", date: "2 Days Ago", title: "New Radiant Line Rollout", snippet: "Supervisors: Ensure all field agents are trained on the new product specifications." }
            ].map((news, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-2">{news.type}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{news.title}</h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{news.snippet}</p>
                <div className="text-xs text-slate-500 font-medium flex justify-between items-center mt-auto">
                  <span>{news.date}</span>
                  <Link to="/login" className="text-slate-900 hover:text-pink-600">Read Full &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DEPARTMENT SPOTLIGHTS */}
      <section id="departments" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Enterprise Departments</h2>
            <p className="text-slate-600">
              Integrated modules tailored for specific organizational workflows and reporting lines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Manufacturing", icon: Box, color: "bg-blue-100 text-blue-600" },
              { name: "Sales & Field", icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
              { name: "Logistics", icon: Truck, color: "bg-amber-100 text-amber-600" },
              { name: "Quality Assurance", icon: FileCheck2, color: "bg-purple-100 text-purple-600" },
              { name: "Human Resources", icon: Users, color: "bg-rose-100 text-rose-600" },
              { name: "Executive Suite", icon: Building2, color: "bg-slate-200 text-slate-700" },
              { name: "Procurement", icon: Target, color: "bg-cyan-100 text-cyan-600" },
              { name: "Analytics", icon: BarChart3, color: "bg-indigo-100 text-indigo-600" }
            ].map((dept, i) => (
              <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm cursor-pointer">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${dept.color}`}>
                  <dept.icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800">{dept.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. EXECUTIVE MESSAGE */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
            <div className="md:w-2/5 aspect-square md:aspect-auto">
              <img src="manager.jpeg" alt="Executive" className="w-full h-full object-cover" />
            </div>
            <div className="md:w-3/5 p-10 md:p-14 flex flex-col justify-center text-white">
              <div className="inline-block text-pink-400 font-bold uppercase tracking-wider text-xs mb-6">Message from Leadership</div>
              <blockquote className="text-2xl font-light leading-snug mb-8">
                "Welcome to the new era of Movit operations. Supervisor Eye gives us the clarity and accountability needed to maintain our position as industry leaders across Africa."
              </blockquote>
              <div>
                <div className="font-bold text-lg">Omule Brian Fredrick.</div>
                <div className="text-slate-400 text-sm">Group Executive Office</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IT TEAM SECTION */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Meet part of our Development team</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              The IT TEAM OF MOVIT working behind the scenes to deliver robust enterprise solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Omule Brian Fredrick',
                role: 'Team Captain / IT Developer',
                email: 'omulebrianfredrick@gmail.com',
                phone: '+256702634715',
                initials: 'OB',
                imageUrl: '/omule.jpg' 
              },
              {
                name: 'Delina Tedros Weldeab',
                role: 'IT Developer',
                email: 'vanu.ted2@gmail.com',
                phone: '+250 795871861',
                initials: 'DW',
                imageUrl: 'delina.jpeg' 
              },
              {
                name: 'Male Daniel Junior',
                role: 'IT Developer',
                email: 'danielmale62@gmail.com',
                phone: '+256 772614374',
                initials: 'MJ',
                imageUrl: 'male.jpg'
              },
              {
                name: 'Gordon Koang Bol',
                role: 'IT Developer',
                email: 'bolkoang340@gmail.com',
                phone: '+256 786117198',
                initials: 'GB',
                imageUrl: 'bol.jpg' 
              },
              {
                name: 'Kisa John Mark',
                role: 'IT Developer',
                email: 'kisajohnmark@gmail.com',
                phone: '+256 756681514',
                initials: 'KM',
                imageUrl: 'mark.jpg' 
              }
            ].map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow text-center">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="w-20 h-20 mx-auto rounded-full object-cover mb-4 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 mx-auto bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-2xl mb-4">
                    {member.initials}
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                <div className="text-pink-600 text-sm font-bold uppercase tracking-wider mb-4">{member.role}</div>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {member.email}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {member.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. COMPANY CULTURE */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row gap-12 items-center">
             <div className="md:w-1/2">
                <h2 className="text-3xl font-black text-slate-900 mb-6">Driven By Our People</h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Our workforce is the heartbeat of Movit Group. Through collaboration, dedication, and a commitment to excellence, we build more than products—we build a legacy.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Continuous Learning & Development', 'Cross-department Collaboration', 'Safety & Wellbeing First', 'Rewarding Performance'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-800 font-medium">
                      <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="inline-flex items-center gap-2 font-bold text-pink-600 hover:text-pink-700">
                  Access HR Portal <ArrowRight className="w-4 h-4" />
                </Link>
             </div>
             <div className="md:w-1/2 relative">
               <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000" alt="Movit Team Culture" className="rounded-2xl shadow-xl w-full" />
               <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-[200px] hidden sm:block">
                 <div className="flex items-center gap-2 text-amber-500 mb-2">
                   {[1,2,3,4,5].map(star => <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                 </div>
                 <div className="font-bold text-slate-800">Top Employer Award</div>
                 <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">voted internally</div>
               </div>
             </div>
           </div>
        </div>
      </section>

      {/* 10. QUICK LINKS & FOOTER */}
      <section className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-600" /> Movit Quick Links
          </h3>
          <div className="flex flex-wrap gap-4">
            <a href="https://movitproducts.com/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-pink-500 hover:text-pink-600 transition-colors shadow-sm">
              Corporate Website
            </a>
            <a href="https://movitproducts.com/about/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-pink-500 hover:text-pink-600 transition-colors shadow-sm">
              About Movit
            </a>
            <a href="https://movitproducts.com/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-pink-500 hover:text-pink-600 transition-colors shadow-sm">
              Our Products
            </a>
            <a href="https://movitproducts.com/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-pink-500 hover:text-pink-600 transition-colors shadow-sm">
              Official Resources
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1">
              <img src="/logo.png" alt="Supervisor Eye" className="h-10 w-auto object-contain brightness-0 invert opacity-80 mb-6" />
              <p className="text-sm">
                Internal enterprise platform for Movit Group of Companies. Unauthorized access is strictly prohibited.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Employee Sign In</Link></li>
                <li><Link to="/metrics" className="hover:text-white transition-colors">Performance Dashboard</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Report Submission</Link></li>
                <li><Link to="/evidence" className="hover:text-white transition-colors">Evidence Library</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">IT Helpdesk</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Document Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Enterprise</h4>
              <ul className="space-y-2 text-sm">
                <li>System Version: v4.2.1-EE</li>
                <li>Security Protocols: Active</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs">
            <div>&copy; {new Date().getFullYear()} Movit Group of Companies. All rights reserved.</div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Use</a>
              <a href="#" className="hover:text-white">Corporate Guidelines</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

