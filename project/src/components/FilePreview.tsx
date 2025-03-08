import React from 'react';
import { FileText, Star, Clock, Calendar, AlertTriangle, Pencil } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { format } from 'date-fns';

interface FilePreviewProps {
  files: {
    type: string;
    name: string;
    count: number;
    priority: number;
    deadline?: string;
    color: string;
    fileName?: string;
  }[];
  onEdit: (file: FilePreviewProps['files'][0]) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, onEdit }) => {
  // Sort files by priority
  const sortedFiles = [...files].sort((a, b) => a.priority - b.priority);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'kpi':
        return 'KPI Targets';
      case 'wins':
        return 'Recent Wins';
      case 'hitlist':
        return 'Hit List';
      case 'masterhouse':
        return 'Masterhouse';
      default:
        return type;
    }
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    try {
      return format(new Date(deadline), 'MMM d, yyyy');
    } catch {
      return deadline;
    }
  };

  return (
    <div className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4 border border-eggplant-800/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-eggplant-100">Uploaded Lists</h3>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="flex items-center gap-1 text-xs text-eggplant-300 cursor-help">
                <Star className="h-3 w-3" />
                <span>Priority order shown</span>
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                sideOffset={5}
              >
                Files are ordered by priority level, with 1 being highest priority
                <Tooltip.Arrow className="fill-dark-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      <div className="space-y-2">
        {sortedFiles.map((file) => (
          <div 
            key={file.type}
            className={clsx(
              "relative overflow-hidden rounded-lg border transition-all duration-300",
              "hover:shadow-lg hover:scale-[1.01] group",
              file.color
            )}
          >
            <div className="p-3 bg-gradient-to-r from-dark-900/20 to-transparent backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white" />
                  <div>
                    <h4 className="font-medium text-white">
                      {file.fileName || getTypeLabel(file.type)}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-white/80">
                        {getTypeLabel(file.type)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="text-xs text-white/80">
                        {file.count} accounts
                      </span>
                      {file.type === 'hitlist' && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/30" />
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Priority {file.priority}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {file.deadline && (
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="flex items-center gap-1 text-xs text-white/80 bg-dark-900/30 px-2 py-1 rounded-lg">
                            <Clock className="h-3 w-3" />
                            <span>{formatDeadline(file.deadline)}</span>
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg"
                            sideOffset={5}
                          >
                            {file.type === 'wins' 
                              ? 'Follow-up deadline'
                              : 'Completion deadline'}
                            <Tooltip.Arrow className="fill-dark-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  )}

                  <button
                    onClick={() => onEdit(file)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-dark-900/30 text-white/80 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-eggplant-400 mx-auto mb-2" />
          <p className="text-sm text-eggplant-200">No files uploaded yet</p>
          <p className="text-xs text-eggplant-300 mt-1">
            Start by uploading your Masterhouse list
          </p>
        </div>
      )}
    </div>
  );
};

export default FilePreview;