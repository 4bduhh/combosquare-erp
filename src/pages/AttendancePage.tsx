import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Employee, AttendanceEntry, AttendanceStatus } from '@/lib/types';
import { PageHeader, PageContainer } from '@/components/Sidebar';
import { EmptyState } from '@/components/EmptyState';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { CalendarCheck, CalendarX, CalendarClock, Users, ChevronLeft, ChevronRight, Check, X, Clock, Plane } from 'lucide-react';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: typeof Check }> = {
  present: { label: 'Present', color: '#22c55e', bg: 'bg-green-100 text-green-700', icon: Check },
  absent: { label: 'Absent', color: '#ef4444', bg: 'bg-red-100 text-red-700', icon: X },
  half_day: { label: 'Half Day', color: '#f59e0b', bg: 'bg-amber-100 text-amber-700', icon: Clock },
  leave: { label: 'Leave', color: '#7653B8', bg: 'bg-[#7653B8]/10 text-[#7653B8]', icon: Plane },
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const [emp, att] = await Promise.all([
      supabase.from('employees').select('*').order('name', { ascending: true }),
      supabase.from('attendance').select('*'),
    ]);
    setEmployees(emp.data ?? []);
    setAttendance(att.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markStatus = async (employeeId: string, status: AttendanceStatus) => {
    setSaving(employeeId);
    const existing = attendance.find((a) => a.employee_id === employeeId && a.date === selectedDate);
    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({ employee_id: employeeId, date: selectedDate, status });
    }
    await load();
    setSaving(null);
  };

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(toISODate(d));
  };

  const todayStats = useMemo(() => {
    const todays = attendance.filter((a) => a.date === selectedDate);
    return {
      present: todays.filter((a) => a.status === 'present').length,
      absent: todays.filter((a) => a.status === 'absent').length,
      half_day: todays.filter((a) => a.status === 'half_day').length,
      leave: todays.filter((a) => a.status === 'leave').length,
      unmarked: employees.length - todays.length,
    };
  }, [attendance, selectedDate, employees]);

  // Last 30 days attendance % per employee
  const monthlyPercent = useMemo(() => {
    const map = new Map<string, { present: number; total: number }>();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    attendance.forEach((a) => {
      if (new Date(a.date) < cutoff) return;
      const cur = map.get(a.employee_id) ?? { present: 0, total: 0 };
      cur.total += 1;
      if (a.status === 'present' || a.status === 'half_day') cur.present += a.status === 'present' ? 1 : 0.5;
      map.set(a.employee_id, cur);
    });
    return map;
  }, [attendance]);

  const getStatusForDate = (employeeId: string) =>
    attendance.find((a) => a.employee_id === employeeId && a.date === selectedDate)?.status ?? null;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#E8E5F0] border-t-[#7653B8] rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Attendance"
        subtitle="Mark and track daily employee attendance"
        action={
          <div className="flex items-center gap-2 glass-card rounded-xl px-2 py-1.5">
            <button onClick={() => changeDay(-1)} className="p-1.5 rounded-lg hover:bg-[#F0EEF8] text-[#6B6580]">
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-[#1F1B2E] outline-none bg-transparent cursor-pointer"
            />
            <button onClick={() => changeDay(1)} className="p-1.5 rounded-lg hover:bg-[#F0EEF8] text-[#6B6580]">
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      {employees.length === 0 ? (
        <div className="glass-card rounded-2xl p-8">
          <EmptyState
            icon={<Users className="text-[#7653B8]" size={40} />}
            title="No employees yet"
            description="Add employees first from the Employees page, then you can start marking their attendance here."
          />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-green-100"><CalendarCheck className="text-green-600" size={18} /></div><span className="text-sm text-[#6B6580]">Present</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={todayStats.present} /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-2">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-red-100"><CalendarX className="text-red-500" size={18} /></div><span className="text-sm text-[#6B6580]">Absent</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={todayStats.absent} /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-amber-100"><CalendarClock className="text-amber-500" size={18} /></div><span className="text-sm text-[#6B6580]">Half Day</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={todayStats.half_day} /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-[#7653B8]/10"><Plane className="text-[#7653B8]" size={18} /></div><span className="text-sm text-[#6B6580]">Leave</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={todayStats.leave} /></p>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in-up stagger-5">
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-[#F0EEF8]"><Users className="text-[#9B95A8]" size={18} /></div><span className="text-sm text-[#6B6580]">Unmarked</span></div>
              <p className="text-2xl font-extrabold text-[#1F1B2E]"><AnimatedCounter value={todayStats.unmarked} /></p>
            </div>
          </div>

          {/* Employee list with status buttons */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-[#1F1B2E] mb-4">
              Mark Attendance — {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {employees.map((emp) => {
                const current = getStatusForDate(emp.id);
                const pct = monthlyPercent.get(emp.id);
                const attendancePct = pct && pct.total > 0 ? Math.round((pct.present / pct.total) * 100) : null;
                return (
                  <div key={emp.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#F8F7FC] hover:bg-[#F0EEF8] transition-all">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt={emp.name} className="w-10 h-10 rounded-xl object-cover border border-[#E8E5F0] shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-peach-gradient flex items-center justify-center text-white font-bold shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1F1B2E] text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-[#9B95A8] truncate">{emp.role}{attendancePct !== null ? ` · ${attendancePct}% (30d)` : ''}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                        const cfg = STATUS_CONFIG[status];
                        const Icon = cfg.icon;
                        const active = current === status;
                        return (
                          <button
                            key={status}
                            disabled={saving === emp.id}
                            onClick={() => markStatus(emp.id, status)}
                            title={cfg.label}
                            className={`p-2 rounded-lg transition-all ${active ? cfg.bg : 'text-[#9B95A8] hover:bg-[#E8E5F0]'} disabled:opacity-50`}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}