import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { optimizeImage } from '@/lib/utils/imageOptimizer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  className?: string;
}

export function PhotoUpload({ onUpload, maxFiles = 5, className }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Remove any files that would exceed the maxFiles limit
      const availableSlots = maxFiles - previews.length;
      const filesToProcess = acceptedFiles.slice(0, availableSlots);

      if (filesToProcess.length === 0) {
        setError(`Maximum ${maxFiles} photos allowed`);
        return;
      }

      // Process each file
      const processedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          const optimizedFile = await optimizeImage(file);
          const preview = URL.createObjectURL(optimizedFile);
          return { file: optimizedFile, preview };
        })
      );

      setPreviews((prev) => [...prev, ...processedFiles]);
    } catch (err) {
      setError('Error processing images. Please try again.');
      console.error('Error processing images:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [maxFiles, previews.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  });

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onUpload(previews.map(p => p.file));
      
      // Clean up previews after successful upload
      previews.forEach(p => URL.revokeObjectURL(p.preview));
      setPreviews([]);
    } catch (err) {
      setError('Failed to upload photos. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the photos here...'
            : `Drag 'n' drop photos here, or click to select`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Maximum {maxFiles} photos, up to 10MB each
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={preview.preview} className="relative group">
                <img
                  src={preview.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePreview(index)}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Uploading...' : 'Upload Photos'}
          </Button>
        </div>
      )}
    </div>
  );
} 