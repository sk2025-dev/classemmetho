import React, { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { Head } from '@inertiajs/react'

export default function ProfileShow({ user }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form for basic profile info
  const profileForm = useForm({
    name: user.name || '',
    email: user.email || '',
  })

  // Form for changing identifier
  const identifierForm = useForm({
    current_password: '',
    new_identifier: user.identifier || '',
  })

  // Form for changing password
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    profileForm.post('/profile/update', {
      onSuccess: () => {
        profileForm.reset()
      },
    })
  }

  const handleIdentifierSubmit = (e) => {
    e.preventDefault()
    identifierForm.post('/profile/identifier', {
      onSuccess: () => {
        identifierForm.reset('current_password')
      },
    })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    passwordForm.post('/profile/password', {
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
      <Head title="Mon Profil" />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mon Profil</h1>
          <p className="text-gray-600 mt-2">Gérez vos informations personnelles et vos accès de sécurité</p>
        </div>

        {/* Tabs */}
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
              📋 Informations
            </button>
            <button
              onClick={() => setActiveTab('identifier')}
              className={`flex-1 py-4 px-6 text-center font-semibold border-b-2 transition ${
                activeTab === 'identifier'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🔑 Identifiant
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 text-center font-semibold border-b-2 transition ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🔐 Mot de passe
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Informations Tab */}
            {activeTab === 'info' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Informations Personnelles</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Identifiant:</strong> {user.identifier}
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    👤 <strong>Rôle:</strong> {user.role === 'admin' ? 'Administrateur' : user.role}
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    📅 <strong>Membre depuis:</strong> {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  {user.last_login_at && (
                    <p className="text-sm text-blue-800 mt-2">
                      🔓 <strong>Dernière connexion:</strong> {new Date(user.last_login_at).toLocaleDateString('fr-FR')} à {new Date(user.last_login_at).toLocaleTimeString('fr-FR')}
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
                    {profileForm.processing ? '⏳ Mise à jour...' : '✅ Mettre à jour'}
                  </button>
                </form>
              </div>
            )}

            {/* Identifier Tab */}
            {activeTab === 'identifier' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Changer l'Identifiant</h2>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Attention:</strong> En changeant votre identifiant, vous devrez l'utiliser pour vous connecter.
                  </p>
                </div>

                <form onSubmit={handleIdentifierSubmit} className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Identifiant actuel:</strong> <code className="bg-white px-2 py-1 rounded">{user.identifier}</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nouvel Identifiant</label>
                    <input
                      type="text"
                      value={identifierForm.data.new_identifier}
                      onChange={(e) => identifierForm.setData('new_identifier', e.target.value.toUpperCase())}
                      placeholder="Ex: JEAN_DUPONT_001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    {identifierForm.errors.new_identifier && (
                      <p className="text-red-600 text-sm mt-1">{identifierForm.errors.new_identifier}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={identifierForm.data.current_password}
                        onChange={(e) => identifierForm.setData('current_password', e.target.value)}
                        placeholder="Entrez votre mot de passe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {identifierForm.errors.current_password && (
                      <p className="text-red-600 text-sm mt-1">{identifierForm.errors.current_password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={identifierForm.processing}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {identifierForm.processing ? '⏳ Changement...' : '🔄 Changer l\'identifiant'}
                  </button>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Changer le Mot de Passe</h2>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    🔐 <strong>Sécurité:</strong> Choisissez un mot de passe fort avec majuscules, minuscules, chiffres et caractères spéciaux.
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
                        {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
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
                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
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
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {passwordForm.errors.password_confirmation && (
                      <p className="text-red-600 text-sm mt-1">{passwordForm.errors.password_confirmation}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <p className="font-semibold mb-2">✓ Critères de mot de passe:</p>
                    <ul className="space-y-1">
                      <li>✓ Au moins 8 caractères</li>
                      <li>✓ Au moins une majuscule (A-Z)</li>
                      <li>✓ Au moins une minuscule (a-z)</li>
                      <li>✓ Au moins un chiffre (0-9)</li>
                      <li>✓ Au moins un caractère spécial (@$!%*?&)</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordForm.processing}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {passwordForm.processing ? '⏳ Changement...' : '🔐 Changer le mot de passe'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {profileForm.recentlySuccessful && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            ✅ {profileForm.recentlySuccessful}
          </div>
        )}
        {identifierForm.recentlySuccessful && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            ✅ {identifierForm.recentlySuccessful}
          </div>
        )}
        {passwordForm.recentlySuccessful && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            ✅ {passwordForm.recentlySuccessful}
          </div>
        )}
      </div>
    </div>
  )
}
