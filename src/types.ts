export type ToolId = 'json' | 'base64' | 'hex' | 'hash' | 'text' | 'timestamp';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  category: 'format' | 'encode' | 'crypto' | 'text';
}

export interface TextStats {
  characters: number;
  bytes: number;
  words: number;
  lines: number;
  paragraphs: number;
  whitespaces: number;
}

export interface HexByte {
  offset: number;
  hex: string;
  ascii: string;
  index: number;
}
