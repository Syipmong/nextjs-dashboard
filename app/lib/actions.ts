'use server'

import {z} from 'zod'
import { CreateInvoice } from '../ui/invoices/buttons';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid','pending']),
    date: z.string()
})

const CreateInvoice = FormSchema.omit(
    {
        id: true,
        date: true
    }
)

export async function createInvoice(formData: FormData) {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    }

    console.log(rawFormData)
    
}