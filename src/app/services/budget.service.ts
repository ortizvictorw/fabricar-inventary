import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, addDoc, docData } from '@angular/fire/firestore';
import { create } from 'domain';
import { Observable } from 'rxjs';
import { Product } from './product.service';

export interface Budget {
    id?: string;
    observation: string;
    client: string;
    operator: string;
    finalPrice: number;
    validity: string;
    createdAt: string;
    enabled: boolean;
    products: Product[];
}

@Injectable({
    providedIn: 'root'
})
export class BudgetService {
    private collectionName = 'budgets';

    constructor(private firestore: Firestore) { }

    // Obtener presupuestos desde Firestore
    getBudget(): Observable<Budget[]> {
        const budgetCollection = collection(this.firestore, this.collectionName);
        return collectionData(budgetCollection, { idField: 'id' }) as Observable<Budget[]>;
    }

    // Obtener un presupuesto por ID desde Firestore
    getBudgetById(id: string): Observable<Budget | undefined> {
        const budgetRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return docData(budgetRef, { idField: 'id' }) as Observable<Budget>;
    }

    // Agregar un nuevo presupuesto
    async addBudget(budget: Budget) {
        try {
            const budgetCollection = collection(this.firestore, this.collectionName);
            return await addDoc(budgetCollection, budget);
        } catch (error) {
            console.error('Error al agregar presupuesto:', error);
            throw error;
        }
    }

    // Actualizar un presupuesto en Firestore
    updateBudget(budget: Budget) {
        const budgetRef = doc(this.firestore, `${this.collectionName}/${budget.id}`);
        return updateDoc(budgetRef, {
            observation: budget.observation,
            client: budget.client,
            operator: budget.operator,
            finalPrice: budget.finalPrice,
            validity: budget.validity,
            createdAt: budget.createdAt,
            enabled: budget.enabled
        });
    }
}
