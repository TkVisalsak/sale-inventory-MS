"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/inventory-api/category-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
  status: string;
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.categories.getAll();
        // Map API response to expected format
        const mappedCategories = Array.isArray(data)
          ? data.map((cat) => ({
              id: cat.id,
              name: cat.name || "",
              description: cat.description || "",
              productCount: cat.products_count || cat.productCount || 0,
              status:
                cat.status || (cat.is_active !== false ? "active" : "inactive"),
            }))
          : [];
        setCategories(mappedCategories);
      } catch (err: any) {
        console.error("Error fetching categories:", err);
        setError(err.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      await api.categories.delete(categoryToDelete.id.toString());
      // Remove the category from the list
      setCategories(categories.filter((cat) => cat.id !== categoryToDelete.id));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setError(err.message || "Failed to delete category");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <Link href="/inventory_user/categories/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Categories</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search categories..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>views</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery
                        ? "No categories found matching your search."
                        : "No categories found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FolderTree className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-muted-foreground">
                          {category.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {category.productCount}{" "}
                          {category.productCount === 1 ? "product" : "products"}
                        </Badge>
                      </TableCell>

                      {/* status */}
                      <TableCell>
                        {category.status === "active" ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      {/* action */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Link
                            href={`/inventory_user/categories/edit?id=${category.id}`}
                          >
                            <Button variant="ghost" size="icon-sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                      {/* view */}
                      <TableCell>
                        <Link
                          href={`/inventory_user/categories/view?id=${category.id}`}
                        >
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "
              {categoryToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
