import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

import { api } from '../services/api';
import { KnowledgeDoc } from '../types';
import { DemoBadge } from '../components/common/DemoBadge';

export const KnowledgeBasePage: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledge(search || undefined, selectedCategory || undefined);
      setDocs(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const categories = [
    'Excessive CPU Usage',
    'High Memory Utilization',
    'Low Disk Space',
    'Network Connectivity Failure',
    'Software / Application Errors'
  ];

  const parseList = (str?: string): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [str];
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approved SOP Knowledge Base</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Verified laboratory troubleshooting standards, safe repair checklists, and post-recovery benchmarks.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search SOP documentation by title, symptom, or repair step..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Fault Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Two Column Layout: Documents List + Document Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-2 h-[calc(100vh-18rem)] overflow-y-auto">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedDoc?.id === doc.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 mb-1">
                <span>{doc.doc_id}</span>
                <span className="font-sans font-medium text-slate-500">{doc.risk_level} Risk</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 leading-snug">{doc.title}</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{doc.fault_category}</p>
            </div>
          ))}
        </div>

        {/* Selected Document Details Reader */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 overflow-y-auto h-[calc(100vh-18rem)] space-y-5 text-xs">
          {selectedDoc ? (
            <>
              <div className="pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                    {selectedDoc.doc_id}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    Category: {selectedDoc.fault_category}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Risk: {selectedDoc.risk_level}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{selectedDoc.title}</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Source: <strong>{selectedDoc.source_reference}</strong> • Last Updated: {new Date(selectedDoc.updated_at).toLocaleDateString()}
                </p>
              </div>

              {/* Symptoms */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Recognized Symptoms:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {parseList(selectedDoc.symptoms).map((s, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Physical Evidence */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Required Objective Evidence:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {parseList(selectedDoc.required_evidence).map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>

              {/* Verification Procedure */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Guided Verification Procedure:
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                  {parseList(selectedDoc.verification_procedure).map((v, idx) => (
                    <li key={idx}>{v}</li>
                  ))}
                </ol>
              </div>

              {/* Safe Repair Instructions */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  Approved Safe Repair Instructions:
                </h4>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800">
                  {parseList(selectedDoc.safe_repair_instructions).map((step, idx) => (
                    <p key={idx}>{step}</p>
                  ))}
                </div>
              </div>

              {/* Post-Repair Recovery Checks */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Post-Repair Verification Criteria:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {parseList(selectedDoc.post_repair_checks).map((chk, idx) => (
                    <li key={idx}>{chk}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-center py-12 text-slate-400">Select a Standard Operating Procedure to read details.</p>
          )}
        </div>
      </div>
    </div>
  );
};
