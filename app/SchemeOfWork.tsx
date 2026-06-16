'use client';

import React, { useState } from 'react';

// Bypassing database client for immediate UI testing
const supabase = null; 

export default function SchemeOfWork(props: any) {
  const [schemes, setSchemes] = useState<any[]>([
    { id: '1', week_number: 1, topic: 'Introduction to the Course', objectives: 'Understand core concepts and setup environments.' },
    { id: '2', week_number: 2, topic: 'Deep Dive into System Architecture', objectives: 'Analyze full-stack structures and data routing.' }
  ]);
  const [loading, setLoading] = useState(false);
  
  const [weekNumber, setWeekNumber] = useState('');
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');

  const handleAddWeek = (e: any) => {
    e.preventDefault();
    if (!weekNumber || !topic || !objectives) return;

    const newModule = {
      id: Math.random().toString(),
      week_number: parseInt(weekNumber),
      topic,
      objectives,
    };

    setSchemes([...schemes, newModule].sort((a, b) => a.week_number - b.week_number));
    setWeekNumber('');
    setTopic('');
    setObjectives('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4 text-emerald-400">Add New Scheme of Work Module</h2>
        <form onSubmit={handleAddWeek} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Week Number</label>
              <input
                type="number"
                value={weekNumber}
                onChange={(e: any) => setWeekNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Topic Title</label>
              <input
                type="text"
                value={topic}
                onChange={(e: any) => setTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Learning Objectives</label>
            <textarea
              value={objectives}
              onChange={(e: any) => setObjectives(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 font-semibold px-4 py-2 rounded-lg text-white"
          >
            Add to Scheme of Work
          </button>
        </form>
      </div>

      <div className="bg-slate-950 rounded-xl p-6 border border-slate-900">
        <h2 className="text-2xl font-bold mb-6">Curriculum Timeline Flow</h2>
        {schemes.length === 0 ? (
          <p className="italic text-slate-500">No modules added yet.</p>
        ) : (
          <div className="border-l-2 border-slate-800 ml-4 space-y-8">
            {schemes.map((item: any) => (
              <div key={item.id} className="relative pl-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <span className="text-xs text-emerald-400 font-bold block mb-1">Week {item.week_number}</span>
                  <h3 className="text-lg font-bold mb-2 text-white">{item.topic}</h3>
                  <p className="text-sm text-slate-400">{item.objectives}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}