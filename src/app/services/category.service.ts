import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Category {
  id?: string;
  name: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private collectionName = 'categories';

  constructor(private firestore: Firestore) {}

  // Obtener categorías desde Firestore
  getCategories(): Observable<Category[]> {
    const categoriesCollection = collection(this.firestore, this.collectionName);
    return collectionData(categoriesCollection, { idField: 'id' }) as Observable<Category[]>;
  }

  // Agregar una nueva categoría
  addCategory(category: Category) {
    const categoriesCollection = collection(this.firestore, this.collectionName);
    return addDoc(categoriesCollection, category);
  }

  // Actualizar una categoría
  updateCategory(category: Category) {
    const categoryRef = doc(this.firestore, `${this.collectionName}/${category.id}`);
    return updateDoc(categoryRef, { name: category.name, enabled: category.enabled });
  }
}
