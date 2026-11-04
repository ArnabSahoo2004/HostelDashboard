import React, { useRef, useState } from 'react';
import { useStudentAuth } from '../useStudentAuth';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import pb from '../../api/client';
import {
  ShieldCheck,
  Building,
  Download,
  FileCheck2,
  ExternalLink,
  FileText
} from 'lucide-react';

export const StudentIDCard: React.FC = () => {
  const { student } = useStudentAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const booking = student?.expand?.bookings_via_resident?.[0];
  const room = booking?.expand?.bed?.expand?.room;
  const bed = booking?.expand?.bed;

  // PocketBase file URL for agreement
  const agreementUrl =
    student?.agreementFile && student?.id
      ? pb.files.getURL(student as any, student.agreementFile)
      : null;

  // Download ID card as an image
  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#090d16',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `Hostel_ID_${student?.fullName?.replace(/\s+/g, '_') || 'Resident'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export ID card:', err);
      alert('Could not download image. You can take a screenshot of your ID card.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Digital Hostel ID & Tenancy
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Official resident identity pass and signed rental agreement
        </p>
      </div>

      {/* Responsive Grid: 2 columns on laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Digital ID Pass */}
        <div className="space-y-4">
          <div
            ref={cardRef}
            className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-6 shadow-xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider text-white uppercase">
                    Satabdi Girls' Hostel
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                    Resident Identity Pass
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACTIVE</span>
              </div>
            </div>

            {/* Profile Info & QR */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="col-span-2 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Resident Name
                  </span>
                  <h4 className="text-lg font-black text-white tracking-tight">{student?.fullName}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Room</span>
                    <span className="font-bold text-emerald-400">
                      {room ? `Room ${room.roomNumber}` : 'Hostel Block'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Bed</span>
                    <span className="font-bold text-emerald-400">{bed?.bedLabel || 'A'}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">Mobile No.</span>
                  <span className="font-mono text-slate-200">{student?.phone || 'N/A'}</span>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">Guardian Contact</span>
                  <span className="text-slate-300 font-medium truncate block">
                    {student?.emergencyContactName || student?.fatherName || 'Guardian'} (
                    {student?.emergencyContactPhone || student?.fatherPhone || 'On File'})
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs shrink-0">
                <QRCode
                  value={`HOSTEL_RESIDENT:${student?.id}:${student?.phone}`}
                  size={84}
                />
                <span className="text-[8px] font-mono font-bold text-slate-900 mt-1 uppercase">Gate Pass</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Hostel Reg: #{student?.id?.slice(-6).toUpperCase()}</span>
              <span>Valid Session 2026-27</span>
            </div>
          </div>

          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{downloading ? 'Exporting Image...' : 'Save Digital ID to Phone / Computer'}</span>
          </button>
        </div>

        {/* Right Column: Tenancy Agreement */}
        <div id="agreement" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tenancy Agreement</h3>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                student?.agreementStatus === 'signed'
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
              }`}
            >
              {student?.agreementStatus === 'signed' ? 'Hardcopy Signed' : 'Pending Signature'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The physical tenancy agreement outlines resident policies, caution deposit security, and notice period rules.
          </p>

          {/* Agreement Dates */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Agreement Start</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {student?.agreementStartDate ? new Date(student.agreementStartDate).toLocaleDateString() : 'At Admission'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Agreement Expiry</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {student?.agreementEndDate ? new Date(student.agreementEndDate).toLocaleDateString() : '11 Months Lease'}
              </span>
            </div>
          </div>

          {/* Filing Notes */}
          {student?.agreementNotes && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">Office Filing Note: </span>
              {student.agreementNotes}
            </div>
          )}

          {/* Download Signed Agreement */}
          {agreementUrl ? (
            <a
              href={agreementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20 transition-all shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Download Signed Hard Copy PDF</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto" />
            </a>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 text-center">
              Signed physical copy on record in hostel office file. Digital scan not uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentIDCard;
