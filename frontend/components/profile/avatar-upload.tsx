'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader as Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onUpload,
  onRemove,
  isUploading,
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Avatar className="h-32 w-32 border-4 border-primary/20">
          <AvatarImage src={currentAvatar} alt={userName} />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold handwriting-text">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center"
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Camera className="h-5 w-5" />
        </motion.button>
      </motion.div>

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'w-full max-w-sm border-2 border-dashed rounded-lg p-6 transition-colors text-center',
          isDragging
            ? 'border-primary bg-accent/50'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Upload profile picture</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or click to browse
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG (max 2MB)</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-1" />
          Choose File
        </Button>
        {currentAvatar && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
