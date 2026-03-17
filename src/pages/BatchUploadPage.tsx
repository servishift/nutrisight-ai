// Batch Upload page — CSV analysis (auth-gated, UI ready for backend)

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.name.endsWith('.xlsx'))) {
      setFile(dropped);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/batch/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }
      
      // Download the result CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_analysis_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(true);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/batch/template`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'batch_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  return (
    <PageLayout>
      <div className="container max-w-3xl py-10 md:py-16">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
                Batch Analysis
              </h1>
              <p className="text-muted-foreground">
                Upload a CSV file with ingredient lists to analyze multiple products at once
              </p>
            </div>
            <DatabaseToggle />
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
          >
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Analysis Complete!</p>
              <p className="text-xs text-green-700">Results downloaded successfully</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card-elevated relative cursor-pointer border-2 border-dashed p-10 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleSelect}
          />

          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Upload className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop your CSV file here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports .csv and .xlsx · Max 1000 rows
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* CSV format guide */}
        <div className="mt-6 card-elevated p-5">
          <h3 className="mb-3 font-display text-base font-semibold text-foreground">
            CSV Format
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-foreground">product_name</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground">ingredients</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">Chocolate Bar</td>
                  <td className="px-4 py-2 text-muted-foreground">sugar, cocoa butter, milk powder, soy lecithin</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">Protein Shake</td>
                  <td className="px-4 py-2 text-muted-foreground">whey protein, water, sucralose, xanthan gum</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="gap-2"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Processing…' : 'Analyze Batch'}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" /> Download Template
          </Button>
        </div>

        {/* Info notice */}
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Batch Analysis</p>
            <p className="text-xs text-muted-foreground">
              Upload CSV with product_name and ingredients columns. Results include clean label scores, health risk, allergens, and category predictions.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
