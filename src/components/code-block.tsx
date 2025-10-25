'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
}

export function CodeBlock({ code, className, ...props }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    toast({
      title: 'Copied!',
      description: 'The SQL query has been copied to your clipboard.',
    });
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <div
      className={cn(
        'relative rounded-lg bg-card border p-4 font-code text-sm',
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        onClick={onCopy}
      >
        {hasCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy code</span>
      </Button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
