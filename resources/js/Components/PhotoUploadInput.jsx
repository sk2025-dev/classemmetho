import React, { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Camera, X } from "lucide-react";
import { withBasePath } from "../Utils/urlHelper";

/**
 * Composant pour uploader une photo de profil
 * @param {function} onPhotoSelected - Callback quand une photo est uploadée
 * @param {string} initialPhotoUrl - URL initiale de la photo si elle existe
 * @param {string} size - Taille de l'aperçu: 'sm' (20), 'md' (24), 'lg' (32)
 */
export default function PhotoUploadInput({
    onPhotoSelected,
    onUploadStateChange,
    initialPhotoUrl = null,
    size = "md",
    enableCamera = false,
}) {
    const [preview, setPreview] = useState(initialPhotoUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [cameraLabel, setCameraLabel] = useState("");
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    function isInfraredCameraLabel(label) {
        const normalized = String(label || "").toLowerCase();
        return (
            normalized.includes(" ir ") ||
            normalized.includes("infrared") ||
            normalized.includes("windows hello") ||
            normalized.includes("ir uvc")
        );
    }

    const sizeMap = {
        sm: "w-20 h-20",
        md: "w-24 h-24",
        lg: "w-32 h-32",
    };

    const sizeClass = sizeMap[size] || sizeMap.md;

    useEffect(() => {
        setPreview((currentPreview) => {
            if (
                currentPreview &&
                currentPreview.startsWith("blob:") &&
                currentPreview !== initialPhotoUrl
            ) {
                URL.revokeObjectURL(currentPreview);
            }

            return initialPhotoUrl;
        });
    }, [initialPhotoUrl]);

    useEffect(() => {
        const bindStreamToVideo = async () => {
            if (!showCamera || !videoRef.current || !streamRef.current) {
                return;
            }

            const video = videoRef.current;
            video.srcObject = streamRef.current;

            try {
                await new Promise((resolve, reject) => {
                    let resolved = false;

                    const finish = () => {
                        if (resolved) {
                            return;
                        }
                        resolved = true;
                        cleanup();
                        resolve();
                    };

                    const fail = () => {
                        if (resolved) {
                            return;
                        }
                        resolved = true;
                        cleanup();
                        reject(new Error("Video init timeout"));
                    };

                    const onLoadedMetadata = () => {
                        finish();
                    };

                    const onCanPlay = () => {
                        finish();
                    };

                    const cleanup = () => {
                        video.removeEventListener(
                            "loadedmetadata",
                            onLoadedMetadata,
                        );
                        video.removeEventListener("canplay", onCanPlay);
                        clearTimeout(timeoutId);
                    };

                    video.addEventListener("loadedmetadata", onLoadedMetadata);
                    video.addEventListener("canplay", onCanPlay);

                    const timeoutId = setTimeout(() => {
                        // Always resolve after timeout — IR cameras have videoWidth=0
                        // but the stream is still valid; let capture attempt decide.
                        finish();
                    }, 3000);

                    // Fallback when the stream is already ready.
                    if (
                        video.readyState >= 2 ||
                        (video.videoWidth > 0 && video.videoHeight > 0)
                    ) {
                        finish();
                    }
                });

                await video.play();
                setCameraLabel(
                    streamRef.current?.getVideoTracks?.()[0]?.label ||
                        "Caméra active",
                );
                setCameraReady(true);
            } catch (err) {
                // Stream init timed out but camera may still be usable — allow capture.
                setCameraReady(true);
            }
        };

        bindStreamToVideo();
    }, [showCamera]);

    const loadCameras = async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return [];
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(
                (device) => device.kind === "videoinput",
            );
            setAvailableCameras(cameras);

            if (!selectedDeviceId && cameras[0]?.deviceId) {
                setSelectedDeviceId(cameras[0].deviceId);
            }

            return cameras;
        } catch (_err) {
            return [];
        }
    };

    const startCamera = async (deviceId = "") => {
        stopCamera();
        setCameraReady(false);

        const constraints = deviceId
            ? {
                  video: {
                      deviceId: { exact: deviceId },
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                  },
                  audio: false,
              }
            : {
                  video: {
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                  },
                  audio: false,
              };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setCameraLabel(stream.getVideoTracks?.()[0]?.label || "Caméra active");
        return stream;
    };

    const uploadPhoto = async (file) => {
        // Validation locale
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner une image");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("La photo ne doit pas dépasser 5MB");
            return;
        }

        // Revoke previous object URL to free memory
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        // Créer un aperçu local
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Uploader la photo
        setIsLoading(true);
        setError("");
        if (onUploadStateChange) {
            onUploadStateChange(true);
        }

        const formData = new FormData();
        formData.append("photo", file);

        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") ||
            window.axios?.defaults?.headers?.common?.["X-CSRF-TOKEN"];

        try {
            // Essayer d'abord la route publique pour l'inscription
            // Si l'utilisateur est authentifié, ce sera quand même accepté
            const response = await fetch(
                withBasePath("", "/api/photo/upload-inscription"),
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de l'upload");
            }

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }

            const relativePhotoUrl = data.path
                ? `/storage/${String(data.path).replace(/^\/+/, "")}`
                : data.photo_url || null;

            setPreview(relativePhotoUrl);

            // Callback avec l'URL de la photo
            if (onPhotoSelected) {
                onPhotoSelected(relativePhotoUrl);
            }
        } catch (err) {
            setError(err.message);
            // Restore previous preview and revoke the new object URL
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            setPreview(initialPhotoUrl); // Restore previous preview
        } finally {
            setIsLoading(false);
            if (onUploadStateChange) {
                onUploadStateChange(false);
            }
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadPhoto(file);
        e.target.value = "";
    };

    const stopCamera = () => {
        setCameraReady(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const openCamera = async () => {
        setError("");

        if (!window.isSecureContext) {
            setError(
                "La caméra nécessite une connexion sécurisée (HTTPS ou localhost).",
            );
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Caméra non supportée sur ce navigateur.");
            return;
        }

        try {
            const cameras = await loadCameras();
            const initialDeviceId =
                selectedDeviceId || cameras[0]?.deviceId || "";

            if (initialDeviceId && initialDeviceId !== selectedDeviceId) {
                setSelectedDeviceId(initialDeviceId);
            }

            await startCamera(initialDeviceId);
            setShowCamera(true);
        } catch (err) {
            let message =
                "Impossible d'accéder à la caméra. Vérifiez les permissions navigateur.";

            if (err?.name === "NotAllowedError") {
                message =
                    "Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur.";
            } else if (err?.name === "NotFoundError") {
                message = "Aucune caméra détectée sur cet appareil.";
            } else if (err?.name === "NotReadableError") {
                message =
                    "La caméra est déjà utilisée par une autre application (Zoom, Teams, etc.).";
            } else if (err?.name === "SecurityError") {
                message =
                    "Contexte non sécurisé. Utilisez HTTPS ou localhost pour activer la caméra.";
            }

            setError(message);
        }
    };

    const closeCamera = () => {
        stopCamera();
        setShowCamera(false);
    };

    const handleCameraChange = async (e) => {
        const nextDeviceId = e.target.value;
        setSelectedDeviceId(nextDeviceId);

        try {
            await startCamera(nextDeviceId);
        } catch (_err) {
            setError("Impossible d'utiliser cette caméra.");
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !streamRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const context = canvas.getContext("2d");
        if (!context) {
            setError("Impossible de capturer la photo.");
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    setError("Capture échouée.");
                    return;
                }

                const capturedFile = new File(
                    [blob],
                    `capture_${Date.now()}.jpg`,
                    { type: "image/jpeg" },
                );

                closeCamera();
                await uploadPhoto(capturedFile);
            },
            "image/jpeg",
            0.92,
        );
    };

    const handleRemove = () => {
        setPreview(null);
        setError("");
        if (onPhotoSelected) {
            onPhotoSelected(null);
        }
    };

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (preview && preview.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Aperçu */}
            {preview ? (
                <div
                    className={`${sizeClass} rounded-full overflow-hidden border-2 border-blue-300 shadow-lg relative group`}
                >
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ) : (
                <div
                    className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-blue-300 flex items-center justify-center`}
                >
                    <Upload size={32} className="text-blue-400" />
                </div>
            )}

            {/* Input file */}
            <label className="cursor-pointer">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                    className="hidden"
                />
                <span
                    className={`inline-block px-4 py-2 rounded-lg font-semibold transition-all ${
                        isLoading
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    }`}
                >
                    {isLoading ? "Chargement..." : "Choisir une photo"}
                </span>
            </label>

            {enableCamera && (
                <button
                    type="button"
                    onClick={openCamera}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        isLoading
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                >
                    <Camera size={16} /> Prendre une photo
                </button>
            )}

            {/* Erreur */}
            {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
                PNG, JPG, GIF • Max 5MB
            </p>

            {showCamera && (
                <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-800">
                                Capture photo
                            </h3>
                            <button
                                type="button"
                                onClick={closeCamera}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4">
                            {availableCameras.length > 1 && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Caméra
                                    </label>
                                    <select
                                        value={selectedDeviceId}
                                        onChange={handleCameraChange}
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3 outline-none focus:border-emerald-500"
                                    >
                                        {availableCameras.map(
                                            (camera, index) => (
                                                <option
                                                    key={
                                                        camera.deviceId || index
                                                    }
                                                    value={camera.deviceId}
                                                >
                                                    {camera.label ||
                                                        `Caméra ${index + 1}`}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            )}

                            <div className="rounded-full overflow-hidden bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-auto max-h-[420px] object-cover scale-x-[-1]"
                                />
                            </div>

                            {!cameraReady && (
                                <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    Initialisation de la caméra...
                                </div>
                            )}

                            {cameraLabel && (
                                <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    Périphérique actif : {cameraLabel}
                                </div>
                            )}

                            {cameraLabel &&
                                isInfraredCameraLabel(cameraLabel) && (
                                    <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                        La caméra détectée semble être une
                                        caméra infrarouge (IR / Windows Hello).
                                        Elle peut afficher un écran noir ou une
                                        image inutilisable dans le navigateur.
                                        Il faut sélectionner une webcam couleur
                                        normale si elle existe sur la machine.
                                    </div>
                                )}

                            <div className="mt-4 flex flex-wrap gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeCamera}
                                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={!streamRef.current}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                                >
                                    <Camera size={16} /> Capturer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
