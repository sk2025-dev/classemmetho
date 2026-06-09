<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with('category')->orderBy('name')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'description' => $p->description,
                'price' => (float) $p->price,
                'quantity' => $p->quantity,
                'image' => $p->image ? (preg_match('/^https?:\/\//', $p->image) ? $p->image : url($p->image)) : null,
                'category' => $p->category ? $p->category->name : null,
                'is_active' => (bool) $p->is_active,
            ];
        });

        return response()->json(['data' => $products]);
    }

    public function show($id)
    {
        $p = Product::with('category')->findOrFail($id);
        return response()->json(['data' => $p]);
    }
}
