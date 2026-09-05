import React, { useState } from "react";
import { Sparkles, ChevronRight, ChevronLeft, X, ArrowUpRight, CheckCircle2, ShieldAlert, Award } from "lucide-react";

export function DemoTourGuide({ activeTab, setActiveTab, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Step 1: Inspect Employee Roster",
      tag: "HR DATA INTEGRITY",
      desc: "In the Employees workspace, notice Priya Sharma (EMP002). She was hired as UI/UX Designer, but intentionally has NO active employment contract assigned yet.",
      targetTab: "employees",
      actionText: "Open Employees Workspace",
    },
    {
      title: "Step 2: Launch Payroll Cockpit",
      tag: "DETERMINISTIC COMPUTE",
      desc: "Navigate to the Payroll Cockpit. Select 'September 2026 Payroll' and click 'Compute Draft'. The engine evaluates all contracts, schedules, and attendance rules.",
      targetTab: "payruns",
      actionText: "Open Payroll Cockpit",
    },
    {
      title: "Step 3: Hard Finalization Blocking",
      tag: "VALIDATION ENGINE ⭐",
      desc: "Observe the red banner! The Validation Engine detects that Priya Sharma has NO active contract. The 'Finalize Payrun' button is strictly disabled with HTTP 422 hard blocking.",
      targetTab: "payruns",
      actionText: "Inspect Blocker Banner",
    },
    {
      title: "Step 4: Contextual Quick-Fix",
      tag: "RESOLVE BLOCKED ISSUE",
      desc: "Click 'Quick Fix: Assign Contract' directly on Priya's red blocker card. Assign her a ₹45,000/month contract with the corporate salary structure.",
      targetTab: "payruns",
      actionText: "Trigger Quick-Fix",
    },
    {
      title: "Step 5: Re-validate & Finalize",
      tag: "ATOMIC FINALIZATION",
      desc: "The cockpit automatically re-evaluates! Critical errors drop to 0, the cockpit turns glowing emerald, and 'Finalize Payrun' unlocks. Click it to freeze the payrun in an atomic transaction!",
      targetTab: "payruns",
      actionText: "Finalize Payrun",
    },
    {
      title: "Step 6: Explainable Payslips & Audit",
      tag: "TRANSPARENCY & AUDIT",
      desc: "Click any payslip in the table to inspect exact formula breakdowns (e.g. HRA = 20% of Basic). Then view the Audit Trail to see tamper-evident before/after mutations!",
      targetTab: "audit",
      actionText: "View Audit Trail",
    },
  ];

  const step = steps[currentStep];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        width: 380,
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(99, 102, 241, 0.4)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.2)",
        overflow: "hidden",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", color: "#ffffff", textTransform: "uppercase" }}>
            Judge Demo Tour ({currentStep + 1} of {steps.length})
          </span>
        </div>

        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span className="badge badge-info" style={{ fontSize: 9 }}>
            {step.tag}
          </span>
        </div>

        <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "#ffffff" }}>
          {step.title}
        </h4>

        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
          {step.desc}
        </p>

        {/* Action Button */}
        <button
          className="btn btn-primary btn-sm"
          style={{ width: "100%", justifyContent: "space-between", padding: "8px 14px", marginBottom: 14 }}
          onClick={() => setActiveTab(step.targetTab)}
        >
          <span>{step.actionText}</span>
          <ArrowUpRight size={14} />
        </button>

        {/* Footer Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
            style={{ padding: "4px 10px", fontSize: 11 }}
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          {/* Step indicators */}
          <div style={{ display: "flex", gap: 4 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentStep(i)}
                style={{
                  width: i === currentStep ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentStep ? "#6366f1" : "rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
              />
            ))}
          </div>

          <button
            className="btn btn-secondary btn-sm"
            disabled={currentStep === steps.length - 1}
            onClick={() => setCurrentStep(currentStep + 1)}
            style={{ padding: "4px 10px", fontSize: 11 }}
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DemoTourGuide;
