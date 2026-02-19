<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Inertia\Inertia;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    /**
     * Afficher la liste des notifications avec filtres optionnels
     */
    public function index(Request $request)
    {
        // Paramètres de filtrage
        $page = $request->get('page', 1);
        $perPage = $request->get('perPage', 20);
        $status = $request->get('status'); // 'read', 'unread', or null (all)
        $search = $request->get('search'); // Recherche par contenu

        // Construire la requête
        $query = Notification::with('user')
            ->orderBy('created_at', 'desc');

        // Filtre par statut de lecture
        if ($status === 'read') {
            $query->where('read_at', '!=', null);
        } elseif ($status === 'unread') {
            $query->whereNull('read_at');
        }

        // Filtre par recherche
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // Pagination optimisée
        $notifications = $query->paginate($perPage, ['*'], 'page', $page);

        return Inertia::render('Admin/Notifications', [
            'notifications' => $notifications,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Afficher une notification spécifique
     */
    public function show($id)
    {
        $notification = Notification::with('user')->findOrFail($id);

        // Marquer comme lue
        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }
        return Inertia::render('Admin/NotificationDetail', [
            'notification' => $notification,
        ]);
    }
}
