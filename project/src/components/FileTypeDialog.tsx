import React, { useState } from 'react';
import { AlertTriangle, X, Calendar, Star } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Switch from '@radix-ui/react-switch';
import clsx from 'clsx';

interface FileTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, deadline?: string, priorityLevel?: number, followUpDays?: number) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const fileTypes = [
  {
    id: 'kpi',
    name: 'KPI Targets',
    description: 'Mandatory visits that must be completed by the deadline',
    requiresDeadline: true,
    isHighPriority: true
  },
  {
    id: 'wins',
    name: 'Recent Wins',
    description: 'Follow-up visits for recent installations',
    requiresFollowUp: true,
    defaultFollowUpDays: 12,
    isHighPriority: true
  },
  {
    id: 'hitlist',
    name: 'Hit List',
    description: 'Custom priority list of pubs to visit',
    requiresPriority: true
  },
  {
    id: 'masterhouse',
    name: 'Masterhouse List',
    description: 'Complete list of all pubs in your territory',
    isLowestPriority: true
  }
];

const FileTypeDialog: React.FC<FileTypeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
  setError
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [needsDeadline, setNeedsDeadline] = useState(false);
  const [priorityLevel, setPriorityLevel] = useState<number>(1);
  const [followUpDays, setFollowUpDays] = useState<number>(12);

  const handleSubmit = () => {
    if (!selectedType) {
      setError('Please select a file type');
      return;
    }

    const fileType = fileTypes.find(t => t.id === selectedType);
    
    if (fileType?.requiresDeadline && !deadline) {
      setError('Please set a deadline');
      return;
    }

    if (fileType?.id === 'hitlist' && needsDeadline && !deadline) {
      setError('Please set a deadline or disable the deadline requirement');
      return;
    }

    onSubmit(
      selectedType,
      needsDeadline ? deadline : undefined,
      fileType?.requiresPriority ? priorityLevel : undefined,
      fileType?.requiresFollowUp ? followUpDays : undefined
    );
  };

  const renderTypeSpecificFields = () => {
    const fileType = fileTypes.find(t => t.id === selectedType);
    if (!fileType) return null;

    return (
      <div className="space-y-4 mt-4">
        {fileType.id === 'wins' && (
          <div>
            <label className="block text-sm font-medium text-eggplant-100 mb-2">
              Follow-up Timeline (Days)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(Math.max(1, parseInt(e.target.value) || 12))}
                className="w-20 px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                min="1"
              />
              <span className="text-sm text-eggplant-200">
                days after installation date
              </span>
            </div>
            <p className="text-xs text-eggplant-300 mt-1">
              Default: 12 days for optimal follow-up timing
            </p>
          </div>
        )}

        {fileType.id === 'hitlist' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-eggplant-100">
                  Set Deadline?
                </label>
                <Switch.Root
                  checked={needsDeadline}
                  onCheckedChange={setNeedsDeadline}
                  className={clsx(
                    "w-10 h-6 rounded-full transition-colors",
                    needsDeadline ? "bg-neon-purple" : "bg-eggplant-800"
                  )}
                >
                  <Switch.Thumb 
                    className={clsx(
                      "block w-4 h-4 bg-white rounded-full transition-transform",
                      "transform translate-x-1",
                      needsDeadline && "translate-x-5"
                    )}
                  />
                </Switch.Root>
              </div>
              {needsDeadline && (
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-eggplant-100 mb-2">
                Priority Level
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    onClick={() => setPriorityLevel(level)}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm transition-colors",
                      priorityLevel === level
                        ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white"
                        : "bg-eggplant-800/50 text-eggplant-200 hover:bg-eggplant-700/50"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-eggplant-300 mt-1">
                1 is highest priority, 4 is lowest priority
              </p>
            </div>
          </>
        )}

        {fileType.requiresDeadline && (
          <div>
            <label className="block text-sm font-medium text-eggplant-100 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
              required
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setSelectedType('');
        setDeadline('');
        setNeedsDeadline(false);
        setPriorityLevel(1);
        setFollowUpDays(12);
        setError(null);
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-eggplant-100">
              Choose List Type
            </Dialog.Title>
            <Dialog.Close className="text-eggplant-400 hover:text-eggplant-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <RadioGroup.Root
            value={selectedType}
            onValueChange={setSelectedType}
            className="space-y-2"
          >
            {fileTypes.map(type => (
              <div key={type.id} className="flex items-start gap-3">
                <RadioGroup.Item
                  value={type.id}
                  className="w-4 h-4 rounded-full border border-eggplant-700 bg-dark-900/50 relative"
                >
                  <RadioGroup.Indicator className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-neon-purple" />
                  </RadioGroup.Indicator>
                </RadioGroup.Item>
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-eggplant-100">{type.name}</span>
                    {type.isHighPriority && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/20 text-red-200 border border-red-700/50">
                        Mandatory
                      </span>
                    )}
                    {type.isLowestPriority && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-eggplant-800/50 text-eggplant-200">
                        Lowest Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-eggplant-200 mt-1">{type.description}</p>
                </label>
              </div>
            ))}
          </RadioGroup.Root>

          {renderTypeSpecificFields()}

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
              Cancel
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-neon-purple to-neon-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-purple transition-all"
            >
              Upload List
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FileTypeDialog;