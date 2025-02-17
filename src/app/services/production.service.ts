import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, docData, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, switchMap, take } from 'rxjs';

export interface Product {
    id: string;
    name: string;
    quantity: number;
    price: number;

}export interface Budget {
    id?: string;
    observation: string;
    client: string;
    operator: string;
    finalPrice: number;
    validity: string;
    createdAt: string;
    enabled: boolean;
    completed?: boolean;
    products: Product[];
}
@Injectable({
    providedIn: 'root'
})
export class ProductionService {
    private readonly budgetsCollection = 'budgets'; // Colección de presupuestos normales
    private readonly confirmedBudgetsCollection = 'confirmedBudgets'; // Presupuestos confirmados

    constructor(private firestore: Firestore) { }

    // Obtener presupuestos confirmados desde Firestore
    getConfirmedBudgets(): Observable<Budget[]> {
        const budgetCollection = collection(this.firestore, this.confirmedBudgetsCollection);
        return collectionData(budgetCollection, { idField: 'id' }) as Observable<Budget[]>;
    }

    // Confirmar un presupuesto (Moverlo a la colección 'confirmedBudgets' y eliminarlo de 'budgets')
    confirmBudget(id: string): Observable<void> {
        const originalBudgetRef = doc(this.firestore, `${this.budgetsCollection}/${id}`);
        const confirmedBudgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);

        return new Observable(observer => {
            docData(originalBudgetRef).subscribe(budget => {
                if (budget) {
                    // Clonar el presupuesto en 'confirmedBudgets'
                    setDoc(confirmedBudgetRef, { ...budget, enabled: true })
                        .then(() => {
                            // Eliminar el presupuesto original de 'budgets'
                            return deleteDoc(originalBudgetRef);
                        })
                        .then(() => {
                            observer.next();
                            observer.complete();
                        })
                        .catch(error => observer.error(error));
                } else {
                    observer.error(new Error('Budget not found'));
                }
            });
        });
    }

    // Obtener un presupuesto por ID (de la colección de confirmados)
    getBudgetById(id: string): Observable<Budget | undefined> {
        const budgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
        return docData(budgetRef, { idField: 'id' }) as Observable<Budget>;
    }

    // Marcar presupuesto como completado
    completeBudget(id: string): Observable<void> {
        const budgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
        return from(updateDoc(budgetRef, { completed: true }));
    }

    // Descartar un presupuesto (de la colección de confirmados)
    discardBudget(id: string): Observable<void> {
        const budgetRef = doc(this.firestore, `${this.budgetsCollection}/${id}`);
        return from(deleteDoc(budgetRef));
    }

    confirmBudgetAndCreateBalance(id: string): Observable<void> {
        const confirmedBudgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
    
        return docData(confirmedBudgetRef).pipe(
            take(1),
            switchMap(budget => {
                if (!budget || !budget['products'] || budget['products'].length === 0) {
                    throw new Error('Budget not found or empty products list');
                }

                const batch = budget['products'].map((product: Product) => {
                    const balanceRef = doc(this.firestore, `balance/${id}_${product.name.replace(/\s+/g, '_')}`);
                    
                    return setDoc(balanceRef, {
                        balanceId: id,
                        client: budget['client'],
                        observation: budget['observation'],
                        operator: budget['operator'],
                        productName: product.name,
                        quantity: Number(product.quantity),
                        unitPrice: Number(product.price),
                        totalPrice: Number(product.quantity) * Number(product.price),
                        createdAt: budget['createdAt'],
                        validity: budget['validity'],
                        timestamp: new Date()
                    });
                });

                return from(Promise.all(batch)).pipe(
                    switchMap(() => from(deleteDoc(confirmedBudgetRef)))
                );
            })
        );
    }
}
