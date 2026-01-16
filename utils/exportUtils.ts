import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Message, ChatSession } from '../types';

export const exportToPDF = (session: ChatSession) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Chat Export: ${session.title || 'Untitled'}`, 10, 10);
    doc.setFontSize(12);

    let y = 20;
    session.messages.forEach(msg => {
        const role = msg.role.toUpperCase();
        const cleanContent = msg.content.replace(/\*\*/g, '').replace(/###/g, ''); // Basic clean
        const text = doc.splitTextToSize(`${role} (${new Date(msg.timestamp).toLocaleString()}): ${cleanContent}`, 180);

        if (y + text.length * 7 > 280) { doc.addPage(); y = 10; }
        doc.text(text, 10, y);
        y += text.length * 7 + 5;
    });
    doc.save(`dark-ai-chat-${session.id}.pdf`);
};

export const exportToWord = async (session: ChatSession) => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: `Chat Export: ${session.title || 'Untitled'}`,
                    heading: HeadingLevel.HEADING_1,
                }),
                ...session.messages.flatMap(msg => [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${msg.role.toUpperCase()} - ${new Date(msg.timestamp).toLocaleString()}`,
                                bold: true,
                                color: msg.role === 'user' ? "4F46E5" : "000000"
                            })
                        ],
                        spacing: { before: 200 }
                    }),
                    new Paragraph({
                        text: msg.content,
                        spacing: { after: 200 }
                    })
                ])
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `dark-ai-chat-${session.id}.docx`);
};

export const exportToText = (session: ChatSession) => {
    let content = `Chat Export: ${session.title || 'Untitled'}\n\n`;
    session.messages.forEach(msg => {
        content += `[${new Date(msg.timestamp).toLocaleString()}] ${msg.role.toUpperCase()}:\n${msg.content}\n\n-------------------\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `dark-ai-chat-${session.id}.txt`);
};

export const exportToJSON = (session: ChatSession) => {
    const content = JSON.stringify(session, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `dark-ai-chat-${session.id}.json`);
};
