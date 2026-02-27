import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

// pdfjs-dist の worker を CDN から読み込む
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { showArrow?: boolean }
>(({ className, sideOffset = 4, showArrow = false, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "relative z-50 max-w-[280px] rounded-md bg-popover text-popover-foreground px-1.5 py-1 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        >
            {props.children}
            {showArrow && <TooltipPrimitive.Arrow className="-my-px fill-popover" />}
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 5.25L12 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.75 12L12 5.25L5.25 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
    </svg>
);

export interface PromptBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onSubmit?: () => void;
    loading?: boolean;
}

export const PromptBox = React.forwardRef<HTMLTextAreaElement, PromptBoxProps>(
    ({ className, value, onChange, onSubmit, loading, ...props }, ref) => {
        const [isListening, setIsListening] = React.useState(false);
        const [isAttaching, setIsAttaching] = React.useState(false);
        const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null);
        const fileInputRef = React.useRef<HTMLInputElement>(null);
        const recognitionRef = React.useRef<any>(null);
        const valueRef = React.useRef(value);

        React.useImperativeHandle(ref, () => internalTextareaRef.current!, []);

        // sync ref with prop
        React.useEffect(() => {
            valueRef.current = value;
        }, [value]);

        const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            setIsAttaching(true);
            try {
                let combinedText = "";

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    let textContent = "";

                    if (file.type === 'application/pdf') {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            const page = await pdf.getPage(pageNum);
                            const pageTextContent = await page.getTextContent();
                            const pageText = pageTextContent.items.map((item: any) => item.str).join(" ");
                            textContent += pageText + "\n";
                        }
                    } else {
                        textContent = await file.text();
                    }

                    combinedText += `\n--- START OF FILE: ${file.name} ---\n${textContent}\n--- END OF FILE: ${file.name} ---\n`;
                }

                const currentVal = valueRef.current as string || "";
                const newValue = currentVal + (currentVal ? "\n" : "") + combinedText;

                const fakeEvent = {
                    target: { value: newValue },
                } as React.ChangeEvent<HTMLTextAreaElement>;

                if (onChange) onChange(fakeEvent);
            } catch (err) {
                console.error("File parse error:", err);
                alert("ファイルの読み込みに失敗しました。");
            } finally {
                setIsAttaching(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };

        React.useLayoutEffect(() => {
            const textarea = internalTextareaRef.current;
            if (textarea) {
                textarea.style.height = "auto";
                const newHeight = Math.min(textarea.scrollHeight, 200);
                textarea.style.height = `${newHeight}px`;
            }
        }, [value]);

        const handleVoiceInput = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("お使いのブラウザは音声入力に対応していません。");
                return;
            }

            if (isListening) {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                setIsListening(false);
                return;
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.lang = "ja-JP";
            recognition.interimResults = true;
            recognition.continuous = true;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    const currentVal = valueRef.current as string || "";
                    const newValue = currentVal + finalTranscript;

                    const fakeEvent = {
                        target: { value: newValue },
                    } as React.ChangeEvent<HTMLTextAreaElement>;

                    if (onChange) onChange(fakeEvent);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error !== 'no-speech') {
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                // 自動停止しても、isListening状態なら再始動を検討するか、単に状態をリセットする
                // ユーザーは「手動で止めるまで」を希望しているので、エラーでなければ再開させるのも手ですが
                // 一般的にはストップボタン押下のセマンティクスに合わせます
                setIsListening(false);
                recognitionRef.current = null;
            };

            recognition.start();
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (onSubmit && (value as string).trim()) {
                    onSubmit();
                }
            }
        };

        const hasValue = (value as string)?.trim().length > 0;

        return (
            <div className={cn("flex flex-col rounded-[28px] p-2 transition-colors bg-white border border-zinc-200 cursor-text", className)}>
                <textarea
                    ref={internalTextareaRef}
                    rows={1}
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    className="custom-scrollbar w-full resize-none border-0 bg-transparent p-3 text-black placeholder:text-muted-foreground focus:ring-0 focus-visible:outline-none min-h-12"
                    {...props}
                />

                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.txt,.csv,.md"
                    onChange={handleFileAttach}
                />

                <div className="mt-0.5 p-1 pt-0">
                    <TooltipProvider delayDuration={100}>
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isAttaching}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-black opacity-40 transition-colors hover:bg-zinc-100 focus-visible:outline-none"
                                    >
                                        {isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                                        <span className="sr-only">Attach file</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" showArrow={true}>
                                    <p>ファイルを添付</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="ml-auto flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={handleVoiceInput}
                                            className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full text-black opacity-40 transition-colors hover:bg-zinc-100 focus-visible:outline-none",
                                                isListening && "animate-pulse bg-red-100 text-red-600 opacity-100"
                                            )}
                                        >
                                            <MicIcon className="h-5 w-5" />
                                            <span className="sr-only">Record voice</span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" showArrow={true}>
                                        <p>{isListening ? "音声入力を停止" : "音声入力を開始"}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={onSubmit}
                                            disabled={!hasValue || loading}
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-transparent border border-black text-black hover:bg-zinc-100 disabled:opacity-40"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-black" />
                                            ) : (
                                                <SendIcon className="h-6 w-6 text-black" />
                                            )}
                                            <span className="sr-only">Send message</span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" showArrow={true}><p>Send</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </TooltipProvider>
                </div>
            </div>
        );
    }
);
PromptBox.displayName = "PromptBox";
