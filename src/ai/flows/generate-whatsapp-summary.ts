// src/ai/flows/generate-whatsapp-summary.ts
'use server';

/**
 * @fileOverview Generates a WhatsApp-formatted summary of student marks for a given class and subject.
 *
 * - generateWhatsappSummary - A function that generates the WhatsApp summary.
 * - GenerateWhatsappSummaryInput - The input type for the generateWhatsappsummary function.
 * - GenerateWhatsappSummaryOutput - The return type for the generateWhatsappSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhatsappSummaryInputSchema = z.object({
  className: z.string().describe('The name of the class.'),
  subjectName: z.string().describe('The name of the subject.'),
  students: z.array(
    z.object({
      name: z.string().describe('The name of the student.'),
      marks: z.number().describe('The marks obtained by the student.'),
    })
  ).describe('An array of student objects with their names and marks.'),
});
export type GenerateWhatsappSummaryInput = z.infer<typeof GenerateWhatsappSummaryInputSchema>;


const GenerateWhatsappSummaryOutputSchema = z.object({
  message: z.string().describe('The formatted message for WhatsApp.'),
});
export type GenerateWhatsappSummaryOutput = z.infer<typeof GenerateWhatsappSummaryOutputSchema>;

export async function generateWhatsappSummary(input: GenerateWhatsappSummaryInput): Promise<GenerateWhatsappSummaryOutput> {
  return generateWhatsappSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWhatsappSummaryPrompt',
  input: {schema: GenerateWhatsappSummaryInputSchema},
  output: {schema: GenerateWhatsappSummaryOutputSchema},
  prompt: `You are an expert at formatting data for plain text messaging apps like WhatsApp.
Your task is to convert the following JSON data into a clean, readable, monospaced format.

**Data:**
School Name: Abhinav Public School Ajanale
Date: Use today's date in "dd Mon yyyy" format (e.g., 29 Jul 2024).
Class Name: {{{className}}}
Subject Name: {{{subjectName}}}
Students Data: {{{json students}}}

**Instructions:**
1.  **Sort the students:** Sort the 'students' array in descending order based on their 'marks'.
2.  **Rank the students:** Assign a rank to each student based on their sorted position. The student with the highest marks gets rank 1.
3.  **Identify Top Rankers:** Identify the top 3 students.
4.  **Format the Output:** Create a single string with newlines for the WhatsApp message. Follow the format below precisely.
    - Start with the school name and date, each on a new line and formatted with asterisks for bolding.
    - Use hyphens to create separator lines.
    - Add a header for the class and subject.
    - After the subject, list the "Top Rankers". For each top ranker, show their name and their marks in parentheses. Make the marks bold (e.g., *95*).
    - Create a header row for all students: "*Rank | Student Name | Marks*".
    - For each student, create a row with their rank, name, and marks. Ensure the columns are properly aligned to form a neat table. Make the marks bold.
    - At the end, add a line for the total number of students.

**Example Output Format:**
\`\`\`
*Abhinav Public School Ajanale*
*Date:* 29 Jul 2024
---------------------------------
*Marks Summary*
*Class:* 6th Standard
*Subject:* Science (Unit Test 1)

*Top Rankers:*
- Priya Joshi (*95*)
- Rahul Sharma (*92*)
- Sneha Deshmukh (*88*)
---------------------------------
*Rank | Student Name | Marks*
---------------------------------
1.   | Priya Joshi    | *95*
2.   | Rahul Sharma   | *92*
3.   | Sneha Deshmukh | *88*
4.   | Aryan Patil    | *85*
...and so on for all students
---------------------------------
*Total Students:* 10
---------------------------------
\`\`\`

Now, format the provided data.`,
});

const generateWhatsappSummaryFlow = ai.defineFlow(
  {
    name: 'generateWhatsappSummaryFlow',
    inputSchema: GenerateWhatsappSummaryInputSchema,
    outputSchema: GenerateWhatsappSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
