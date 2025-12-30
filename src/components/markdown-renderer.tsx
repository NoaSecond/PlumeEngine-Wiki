import React from 'react';
import { useWiki } from '../context/wiki-context';

interface MarkdownRendererProps {
  content: string;
  searchTerm?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, searchTerm }) => {
  const { isDarkMode } = useWiki();

  const renderContent = (text: string) => {
    let processedText = text;

    // Support des liens [texte](url) - DOIT être traité en premier
    processedText = processedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Support du gras inline avec **texte**
    processedText = processedText.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>'
    );

    // Support de l'italique inline avec *texte*
    processedText = processedText.replace(
      /\*(.*?)\*/g,
      '<em class="italic">$1</em>'
    );

    // Support du code inline avec `code`
    processedText = processedText.replace(
      /`([^`]+)`/g,
      `<code class="${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-200 text-gray-800'} px-1 py-0.5 rounded text-sm font-mono">$1</code>`
    );

    // Highlight search terms
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      processedText = processedText.replace(
        regex,
        '<mark class="bg-yellow-400 text-black px-1 rounded">$1</mark>'
      );
    }

    return processedText;
  };

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className={`list-disc list-inside space-y-1 mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: renderContent(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        if (inList) flushList();
        return;
      }

      // Headers
      if (trimmedLine.startsWith('# ')) {
        if (inList) flushList();
        elements.push(
          <h1 key={index} className={`text-3xl font-bold mb-6 pb-2 border-b ${isDarkMode ? 'text-white border-slate-600' : 'text-gray-900 border-gray-300'}`}>
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(2)) }} />
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) flushList();
        elements.push(
          <h2 key={index} className={`text-2xl font-semibold mb-4 mt-8 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(3)) }} />
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        if (inList) flushList();
        elements.push(
          <h3 key={index} className={`text-xl font-semibold mb-3 mt-6 ${isDarkMode ? 'text-violet-300' : 'text-violet-600'}`}>
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(4)) }} />
          </h3>
        );
      }
      // List items
      else if (trimmedLine.startsWith('- ')) {
        listItems.push(trimmedLine.slice(2));
        inList = true;
      }
      // Regular paragraphs
      else {
        if (inList) flushList();
        elements.push(
          <p key={index} className={`mb-3 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine) }} />
          </p>
        );
      }
    });

    if (inList) flushList();

    return elements;
  };

  return (
    <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
      {parseMarkdown(content)}
    </div>
  );
};