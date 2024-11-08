'use server'

import { z } from 'zod'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Select a valid customer',
    }),
    amount: z.coerce.number().gt(0, 'Amount must be greater than 0'),
    status: z.enum(['paid','pending'],{
        invalid_type_error: 'Select an invoice status'
    }),
    date: z.string()
})

const CreateInvoice = FormSchema.omit(
    {
        id: true,
        date: true
    }
)

const UpdateInvoice = FormSchema.omit({
    id: true,
    date: true
})

export type State = {
    errors?: {
        customerId? : string[],
        amount?: string[],
        status?: string[]
    }
    message?: string | null
}

export async function updateInvoice(id: string, formData: FormData){
    const { customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    })
    const amountInCents = amount * 100;
    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}`;
    } catch (error) {
        return{
            message: "Database error: failed to update invoice"
        }
        
    }

    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function createInvoice(prevState: State, formData: FormData){
        const validateFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
        });


        if(!validateFields.success){
            return{
                errors: validateFields.error.flatten().fieldErrors,
                message: 'Missing Fields: Failed to create invoice'
            }
        }
        const { customerId, amount, status} = validateFields.data;
        const amountInCents = amount * 100;
        const date = new Date().toISOString().split('T')[0];

        try {
            await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
        } catch (error) {
            return{
                message: 'Database Error: Failed to create invoice'
            }
        }

        revalidatePath('/dashboard/invoices');
        redirect('/dashboard/invoices')

}

export async function deleteInvoice(id: string){
    try {
        await sql`
        DELETE FROM invoices WHERE id = ${id}
        `;
    } catch (error) {
        return{
            message: 'Database Error: Failed to delete invoice'
        }
        
    }
    revalidatePath('/dashboard/invoices')

}