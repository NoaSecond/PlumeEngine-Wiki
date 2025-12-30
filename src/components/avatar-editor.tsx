import React, { useState, useRef } from 'react';
import { Upload, X, User } from 'lucide-react';
import { useWiki } from '../context/wiki-context';

interface AvatarEditorProps {
  currentAvatar?: string;
  onSave: (avatar: string) => void;
  onCancel: () => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ currentAvatar, onSave, onCancel }) => {
  const { isDarkMode } = useWiki();
  const [selectedImage, setSelectedImage] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Images prédéfinies disponibles
  const predefinedAvatars = [
    '/avatars/avatar-openbookwiki.svg',
    '/avatars/avatar-blue.svg',
    '/avatars/avatar-green.svg',
    '/avatars/avatar-orange.svg',
    '/avatars/avatar-purple.svg',
    '/avatars/avatar-red.svg',
    '/avatars/avatar-cyan.svg',
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (selectedImage) {
      onSave(selectedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Modifier la photo de profil</h2>
          <button
            onClick={onCancel}
            className={`transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Aperçu de l'avatar sélectionné */}
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Avatar sélectionné"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-white" />
            )}
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Aperçu de votre nouvelle photo</p>
        </div>

        {/* Upload depuis un fichier */}
        <div className="mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors border-2 border-dashed ${isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
              }`}
          >
            <Upload className="w-5 h-5" />
            <span>Télécharger une image</span>
          </button>
          <p className={`text-xs mt-1 text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>JPG, PNG, GIF (max 5MB)</p>
        </div>

        {/* Avatars prédéfinis */}
        <div className="mb-6">
          <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Choisir un avatar prédéfini</h3>
          <div className="grid grid-cols-4 gap-4">
            {predefinedAvatars.map((avatar, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(avatar)}
                className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${selectedImage === avatar
                    ? 'border-cyan-500 scale-110 shadow-lg shadow-cyan-500/30'
                    : `${isDarkMode ? 'border-slate-600 hover:border-slate-400' : 'border-gray-300 hover:border-gray-400'}`
                  }`}
                title={`Avatar ${index + 1}`}
              >
                <img
                  src={avatar}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            Cliquez sur un avatar pour le sélectionner
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                ? 'bg-slate-600 hover:bg-slate-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedImage}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};
