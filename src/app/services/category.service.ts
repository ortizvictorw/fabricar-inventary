import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, doc, query, where, getDocs } from '@angular/fire/firestore';
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
  getBudget(): Observable<Category[]> {
    const categoriesCollection = collection(this.firestore, this.collectionName);
    return collectionData(categoriesCollection, { idField: 'id' }) as Observable<Category[]>;
  }

  // 🔹 Verifica si ya existe una categoría con ese nombre (Case Insensitive)
  async categoryExists(name: string): Promise<boolean> {
    const categoriesCollection = collection(this.firestore, this.collectionName);
    const q = query(categoriesCollection, where('name', '==', name.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Retorna true si ya existe
  }

  // Agregar una nueva categoría si no existe duplicado
  async addCategory(category: Category): Promise<void> {
    category.name = category.name.toLowerCase(); // Convertir a minúsculas para evitar duplicados por mayúsculas

    if (await this.categoryExists(category.name)) {
      throw new Error('Ya existe una categoría con ese nombre.');
    }

    const categoriesCollection = collection(this.firestore, this.collectionName);
    await addDoc(categoriesCollection, category);
  }

  // Actualizar categoría (evitando duplicados)
  async updateCategory(category: Category): Promise<void> {
    category.name = category.name.toLowerCase(); // Normalizar el nombre

    if (await this.categoryExists(category.name)) {
      throw new Error('Ya existe otra categoría con ese nombre.');
    }

    const categoryRef = doc(this.firestore, `${this.collectionName}/${category.id}`);
    await updateDoc(categoryRef, { name: category.name, enabled: category.enabled });
  }
}
