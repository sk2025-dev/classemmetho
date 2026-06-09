<?php

namespace App\Http\Controllers;

use App\Models\BeautyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BeautyServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = BeautyService::query()->where('is_active', true);

        if ($request->filled('section_key')) {
            $query->where('section_key', $request->string('section_key'));
        }

        $items = $query
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get()
            ->map(fn (BeautyService $item) => $this->transform($item));

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'section_key' => ['required', 'string', 'max:100'],
            'category_key' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'duration' => ['nullable', 'string', 'max:50'],
            'price' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('beauty-services', 'public');
        }

        $item = BeautyService::create([
            'section_key' => $data['section_key'],
            'category_key' => $data['category_key'],
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'duration' => $data['duration'] ?? null,
            'price' => $data['price'] ?? null,
            'image_path' => $imagePath,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => true,
        ]);

        return response()->json(['data' => $this->transform($item)], 201);
    }

    public function update(Request $request, BeautyService $beautyService)
    {
        $data = $request->validate([
            'section_key' => ['sometimes', 'string', 'max:100'],
            'category_key' => ['sometimes', 'string', 'max:100'],
            'title' => ['sometimes', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'duration' => ['nullable', 'string', 'max:50'],
            'price' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            if ($beautyService->image_path) {
                Storage::disk('public')->delete($beautyService->image_path);
            }
            $beautyService->image_path = $request->file('image')->store('beauty-services', 'public');
        }

        $beautyService->fill($data);
        $beautyService->save();

        return response()->json(['data' => $this->transform($beautyService)]);
    }

    public function destroy(BeautyService $beautyService)
    {
        if ($beautyService->image_path) {
            Storage::disk('public')->delete($beautyService->image_path);
        }

        $beautyService->delete();

        return response()->json(['message' => 'Service supprimé.']);
    }

    private function transform(BeautyService $item): array
    {
        return [
            'id' => $item->id,
            'section_key' => $item->section_key,
            'category_key' => $item->category_key,
            'title' => $item->title,
            'subtitle' => $item->subtitle,
            'duration' => $item->duration,
            'price' => $item->price,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
            'image_url' => $item->image_path ? asset('storage/' . $item->image_path) : null,
        ];
    }
}
