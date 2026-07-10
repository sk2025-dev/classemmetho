import React, { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { Head } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import useToast from '../../Hooks/useToast'
import ToastContainer from '../../Components/ToastContainer'
import { withBasePath } from '../../Utils/urlHelper'

export default function ProfileShow({ user }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const profileForm = useForm({
    name: user.name || '',
    email: user.email || '',
  })

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const signatureForm = useForm({
    signature: null,
  })
  const [signaturePreview, setSignaturePreview] = useState(user.signature_url || '')
  const toast = useToast()
  const profileLabel = user.name || user.code_membre || 'Profil'
  const profileInitials = profileLabel
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'P'

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    profileForm.post(withBasePath('', '/profile/update'), {
      onSuccess: () => {
        profileForm.reset()
      },
    })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    passwordForm.post(withBasePath('', '/profile/password'), {
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  }

  const handleSignatureSubmit = (e) => {
    e.preventDefault()
    signatureForm.post(withBasePath('', '/profile/signature'), {
      forceFormData: true,
      onSuccess: () => {
        signatureForm.reset()
        toast.success('Signature chargee avec succes.')
      },
    })
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
      <Head title="Mon Profil" />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all backdrop-blur-md border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-100 bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
              {user.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt={profileLabel}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profileInitials}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Mon Profil</h1>
              <p className="text-gray-600 mt-2">Gerez vos informations personnelles et vos acces de securite</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 px-6 text-center font-semibold border-b-2 transition ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 text-center font-semibold border-b-2 transition ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Mot de passe
            </button>
            <button
              onClick={() => setActiveTab('signature')}
              className={`flex-1 py-4 px-6 text-center font-semibold border-b-2 transition ${
                activeTab === 'signature'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Signature electronique
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Informations Personnelles</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Code membre:</strong> {user.code_membre || '-'}
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>Role:</strong> {user.role === 'admin' ? 'Administrateur' : user.role}
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>Membre depuis:</strong> {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  {user.last_login_at && (
                    <p className="text-sm text-blue-800 mt-2">
                      <strong>Derniere connexion:</strong> {new Date(user.last_login_at).toLocaleDateString('fr-FR')} a {new Date(user.last_login_at).toLocaleTimeString('fr-FR')}
                    </p>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nom Complet</label>
                    <input
                      type="text"
                      value={profileForm.data.name}
                      onChange={(e) => profileForm.setData('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {profileForm.errors.name && (
                      <p className="text-red-600 text-sm mt-1">{profileForm.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={profileForm.data.email}
                      onChange={(e) => profileForm.setData('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {profileForm.errors.email && (
                      <p className="text-red-600 text-sm mt-1">{profileForm.errors.email}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={profileForm.processing}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {profileForm.processing ? 'Mise a jour...' : 'Mettre a jour'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Changer le Mot de Passe</h2>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    <strong>Securite:</strong> Choisissez un mot de passe fort avec majuscules, minuscules, chiffres et caracteres speciaux.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.data.current_password}
                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                        placeholder="Entrez votre mot de passe actuel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? 'Afficher' : 'Masquer'}
                      </button>
                    </div>
                    {passwordForm.errors.current_password && (
                      <p className="text-red-600 text-sm mt-1">{passwordForm.errors.current_password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.data.password}
                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                        placeholder="Entrez votre nouveau mot de passe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? 'Afficher' : 'Masquer'}
                      </button>
                    </div>
                    {passwordForm.errors.password && (
                      <p className="text-red-600 text-sm mt-1">{passwordForm.errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.data.password_confirmation}
                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                        placeholder="Confirmez votre nouveau mot de passe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? 'Afficher' : 'Masquer'}
                      </button>
                    </div>
                    {passwordForm.errors.password_confirmation && (
                      <p className="text-red-600 text-sm mt-1">{passwordForm.errors.password_confirmation}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <p className="font-semibold mb-2">Criteres de mot de passe:</p>
                    <ul className="space-y-1">
                      <li>Au moins 8 caracteres</li>
                      <li>Au moins une majuscule (A-Z)</li>
                      <li>Au moins une minuscule (a-z)</li>
                      <li>Au moins un chiffre (0-9)</li>
                      <li>Au moins un caractere special (@$!%*?&)</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordForm.processing}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {passwordForm.processing ? 'Changement...' : 'Changer le mot de passe'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'signature' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Signature electronique</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Ajoutez une image de votre signature pour l'affichage sur les PDF.
                  </p>
                </div>

                <form onSubmit={handleSignatureSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Image de signature (PNG/JPG)</label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        signatureForm.setData('signature', file)
                        if (file) {
                          const url = URL.createObjectURL(file)
                          setSignaturePreview(url)
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {signatureForm.errors.signature && (
                      <p className="text-red-600 text-sm mt-1">{signatureForm.errors.signature}</p>
                    )}
                  </div>

                  {signaturePreview && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Apercu:</p>
                      <img src={signaturePreview} alt="Signature" className="max-h-32" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={signatureForm.processing}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {signatureForm.processing ? 'Enregistrement...' : 'Enregistrer la signature'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {profileForm.recentlySuccessful && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            {profileForm.recentlySuccessful}
          </div>
        )}
        {passwordForm.recentlySuccessful && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            {passwordForm.recentlySuccessful}
          </div>
        )}
        {signatureForm.recentlySuccessful && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            {signatureForm.recentlySuccessful}
          </div>
        )}
      </div>
    </div>
  )
}
