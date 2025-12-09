import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface WhatsappMessageInput {
    className: string;
    subjectName: string;
    students: { name: string; marks: number }[];
}

export function createWhatsappMessage({ className, subjectName, students }: WhatsappMessageInput): string {
    // 1. Sort students by marks descending
    const sortedStudents = [...students].sort((a, b) => b.marks - a.marks);

    // 2. Assign ranks
    const rankedStudents = sortedStudents.map((student, index) => ({
        ...student,
        rank: index + 1,
    }));

    // 3. Identify Top Rankers
    const topRankers = rankedStudents.slice(0, 3);

    // 4. Format the message
    let message = `*Abhinav Public School Ajanale*\n`;
    message += `*Date:* ${format(new Date(), "dd MMM yyyy")}\n`;
    message += `---------------------------------\n`;
    message += `*Marks Summary*\n`;
    message += `*Class:* ${className}\n`;
    message += `*Subject:* ${subjectName}\n\n`;

    message += `*Top Rankers:*\n`;
    topRankers.forEach(student => {
        message += `- ${student.name} (*${student.marks}*)\n`;
    });

    message += `---------------------------------\n`;
    message += `*Rank | Student Name | Marks*\n`;
    message += `---------------------------------\n`;

    rankedStudents.forEach(student => {
        // Basic padding to align columns, adjust spacing as needed
        const rank = `${student.rank}.`.padEnd(4, ' ');
        const name = student.name.padEnd(14, ' ');
        message += `${rank}| ${name}| *${student.marks}*\n`;
    });

    message += `---------------------------------\n`;
    message += `*Total Students:* ${students.length}\n`;
    message += `---------------------------------`;

    return message;
}
