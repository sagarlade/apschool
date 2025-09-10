
// src/app/dashboard/report/scholarship/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAllMarks, getClasses, getSubjects, getExams } from "@/lib/data";
import type { Class, Subject, Exam } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

const SCHOLARSHIP_SUBJECT_NAMES = ['Math', 'English', 'Marathi', 'बुद्धिमत्ता चाचणी'];

interface ScholarshipMark {
    subjectName: string;
    marks: number;
    totalMarks: number;
}

interface ScholarshipReportRow {
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    examId: string;
    examName: string;
    marks: ScholarshipMark[];
    total: number;
}

export default function ScholarshipReportPage() {
    const router = useRouter();
    const [reportData, setReportData] = useState<ScholarshipReportRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user, userRole, loading: authLoading } = useAuth();
    
    useEffect(() => {
        if(!authLoading && userRole !== 'admin') {
            toast({
                title: "Access Denied",
                description: "You do not have permission to view this page.",
                variant: "destructive"
            });
            router.push('/');
        }
    }, [authLoading, userRole, router, toast]);

    const getReportData = useCallback(async () => {
        if (authLoading || !user) return;
        
        setIsLoading(true);
        try {
            const [marksDocs, classes, subjects, exams] = await Promise.all([
                getAllMarks(),
                getClasses(),
                getSubjects(),
                getExams(),
            ]);

            const classMap = new Map(classes.map((c) => [c.id, c.name]));
            const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
            const scholarshipExams = exams.filter(e => e.name.toLowerCase().includes('scholarship'));
            const scholarshipExamIds = new Set(scholarshipExams.map(e => e.id));

            const examMap = new Map(scholarshipExams.map((e) => [e.id, e]));

            const reportMap = new Map<string, ScholarshipReportRow>();

            for (const markDoc of marksDocs) {
                if (!scholarshipExamIds.has(markDoc.examId)) continue;
                
                const exam = examMap.get(markDoc.examId);
                if (!exam) continue;

                for (const studentMark of markDoc.marks) {
                    const subjectName = subjectMap.get(markDoc.subjectId);
                    if (!subjectName || !SCHOLARSHIP_SUBJECT_NAMES.includes(subjectName)) continue;
                    
                    const rowKey = `${studentMark.studentId}_${markDoc.examId}`;
                    
                    if (!reportMap.has(rowKey)) {
                        reportMap.set(rowKey, {
                            studentId: studentMark.studentId,
                            studentName: studentMark.studentName,
                            classId: markDoc.classId,
                            className: classMap.get(markDoc.classId) || "Unknown",
                            examId: markDoc.examId,
                            examName: exam.name,
                            marks: [],
                            total: 0,
                        });
                    }

                    const reportRow = reportMap.get(rowKey)!;
                    const markValue = studentMark.marks ?? 0;

                    reportRow.marks.push({
                        subjectName: subjectName,
                        marks: markValue,
                        totalMarks: exam.totalMarks
                    });

                    reportRow.total += markValue;
                }
            }
            
            const finalData = Array.from(reportMap.values()).sort((a, b) => {
                if (a.examName !== b.examName) {
                    return a.examName.localeCompare(b.examName);
                }
                return b.total - a.total;
            });
            
            setReportData(finalData);

        } catch (error) {
            console.error("Error fetching scholarship report data", error);
            toast({
                title: "Error",
                description: "Failed to load scholarship report data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, user, authLoading]);

    useEffect(() => {
        if(userRole === 'admin') {
            getReportData();
        }
    }, [getReportData, userRole]);


    if (isLoading || authLoading || userRole !== 'admin') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <main className="flex justify-center items-start min-h-screen bg-background p-4 sm:p-6 md:p-10">
            <Card className="w-full max-w-6xl shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                             <Star className="w-8 h-8 text-amber-500" />
                            <div>
                                <CardTitle>Scholarship Exam Report</CardTitle>
                                <CardDescription>
                                    A dedicated report for all scholarship exam marks.
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Exam Name</TableHead>
                                    {SCHOLARSHIP_SUBJECT_NAMES.map(name => (
                                        <TableHead key={name} className="text-center">{name}</TableHead>
                                    ))}
                                    <TableHead className="text-center font-bold">Total Marks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.length > 0 ? (
                                    reportData.map(row => (
                                        <TableRow key={`${row.studentId}-${row.examId}`}>
                                            <TableCell className="font-medium">{row.studentName}</TableCell>
                                            <TableCell>{row.className}</TableCell>
                                            <TableCell>{row.examName}</TableCell>
                                            {SCHOLARSHIP_SUBJECT_NAMES.map(subject => {
                                                const mark = row.marks.find(m => m.subjectName === subject);
                                                return (
                                                    <TableCell key={subject} className="text-center font-mono">
                                                        {mark ? `${mark.marks}` : '-'}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell className="text-center font-bold font-mono">{row.total}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={SCHOLARSHIP_SUBJECT_NAMES.length + 4} className="h-24 text-center">
                                            No scholarship marks found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
