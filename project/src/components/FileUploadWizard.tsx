import React, { useState } from 'react';
import { Beer, Upload, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, FileText, Target, Users } from 'lucide-react';
import FileUploader from './FileUploader';
import { Pub } from '../context/PubDataContext';
import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';

interface FileUploadWizardProps {
  onMasterfileUpload: (pubs: Pub[]) => void;
  onWishlistUpload: (pubs: Pub[]) => void;
  onUnvisitedUpload: (pubs: Pub[]) => void;
  onKpiUpload: (pubs: Pub[]) => void;
  onRepslyUpload: (pubs: Pub[]) => void;
  hasMasterfile: boolean;
}

const FileUploadWizard: React.FC<FileUploadWizardProps> = ({
  onMasterfileUpload,
  onWishlistUpload,
  onUnvisitedUpload,
  onKpiUpload,
  onRepslyUpload,
  hasMasterfile
}) => {
  const [currentStep, setCurrentStep] = useState(hasMasterfile ? 1 : 0);
  const [showOptionalDialog, setShowOptionalDialog] = useState(false);

  const steps = [
    {
      title: "Upload Your Masterfile",
      description: "Let's start with your complete pub list! This Masterfile is essential - it helps us understand your entire territory and optimize your visits.",
      type: "masterfile",
      onUpload: onMasterfileUpload,
      required: true,
      icon: FileText,
      tips: [
        "Use your most up-to-date territory list",
        "Make sure it includes postcodes",
        "Excel files only (.xlsx or .xls)"
      ]
    },
    {
      title: "Add Priority Lists",
      description: "Now let's supercharge your planning! Add specialized lists to ensure you're hitting your most important accounts.",
      type: "optional",
      icon: Target,
      children: [
        {
          name: "Recent Wins",
          description: "Track and follow up on your latest installations",
          type: "repsly",
          onUpload: onRepslyUpload,
          icon: CheckCircle2,
          color: "from-purple-900 to-purple-800"
        },
        {
          name: "Priority #1",
          description: "Your high-priority target accounts",
          type: "wishlist",
          onUpload: onWishlistUpload,
          icon: Target,
          color: "from-blue-900 to-blue-800"
        },
        {
          name: "Priority #2",
          description: "Accounts you haven't visited yet",
          type: "unvisited",
          onUpload: onUnvisitedUpload,
          icon: Users,
          color: "from-green-900 to-green-800"
        },
        {
          name: "KPI Targets",
          description: "Mandatory visits with deadlines",
          type: "kpi",
          onUpload: onKpiUpload,
          icon: Target,
          color: "from-red-900 to-red-800"
        }
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center">
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                currentStep > index
                  ? "bg-green-900/20 text-green-200 border border-green-700/50"
                  : currentStep === index
                    ? "bg-neon-purple text-white"
                    : "bg-eggplant-800/50 text-eggplant-300 border border-eggplant-700/50"
              )}>
                {currentStep > index ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={clsx(
                "ml-2 text-sm hidden sm:block",
                currentStep === index ? "text-eggplant-100" : "text-eggplant-300"
              )}>
                {steps[index].title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 h-0.5 bg-eggplant-800/50" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current step content */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {currentStepData.icon && (
            <currentStepData.icon className="h-8 w-8 text-neon-purple" />
          )}
          <div>
            <h3 className="text-xl font-bold text-eggplant-100">
              {currentStepData.title}
            </h3>
            <p className="text-eggplant-200 mt-1">
              {currentStepData.description}
            </p>
          </div>
        </div>

        {currentStep === 0 ? (
          <div className="space-y-6">
            <div className="bg-eggplant-800/30 rounded-lg p-4">
              <h4 className="font-medium text-eggplant-100 mb-2">Quick Tips:</h4>
              <ul className="space-y-2">
                {currentStepData.tips?.map((tip, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-eggplant-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <FileUploader
                onFileLoaded={onMasterfileUpload}
                fileType="masterfile"
                isLoaded={hasMasterfile}
              />
            </div>
            
            {!hasMasterfile && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-200">
                  The Masterfile is required to start planning your visits. This ensures we can optimize your entire territory.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {currentStepData.children?.map((child, index) => (
              <div 
                key={index} 
                className={clsx(
                  "relative rounded-lg p-4",
                  "bg-gradient-to-br",
                  child.color || "from-eggplant-900 to-eggplant-800",
                  "border border-eggplant-700/30"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  {child.icon && <child.icon className="h-5 w-5 text-white" />}
                  <h4 className="font-medium text-white">
                    {child.name}
                  </h4>
                </div>
                
                <p className="text-sm text-white/80 mb-4">
                  {child.description}
                </p>

                <FileUploader
                  onFileLoaded={child.onUpload}
                  fileType={child.type}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep === 0 ? (
          <button
            onClick={handleNext}
            disabled={!hasMasterfile}
            className={clsx(
              "flex items-center px-4 py-2 rounded-lg transition-all duration-300",
              hasMasterfile
                ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple"
                : "bg-eggplant-800/50 text-eggplant-300 cursor-not-allowed"
            )}
          >
            Next Step
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        ) : (
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple transition-all duration-300"
              >
                Continue
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Beer className="h-8 w-8 text-neon-purple" />
                  <Dialog.Title className="text-xl font-bold text-eggplant-100">
                    Ready to Start Planning?
                  </Dialog.Title>
                </div>
                <Dialog.Description className="text-eggplant-200 mb-6">
                  You've uploaded your Masterfile{" "}
                  {currentStepData.children?.some(child => child.onUpload) && "and some priority lists"}. 
                  Would you like to add more lists or start planning your visits?
                </Dialog.Description>
                <div className="flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
                      Add More Lists
                    </button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white px-4 py-2 rounded-lg hover:shadow-neon-purple transition-all duration-300">
                      Start Planning
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>
    </div>
  );
};

export default FileUploadWizard;