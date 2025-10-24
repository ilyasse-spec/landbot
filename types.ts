export enum BlockType {
  Welcome = 'Welcome',
  Question = 'Question',
  Buttons = 'Buttons',
  Field = 'Field',
  Message = 'Message',
  Goodbye = 'Goodbye',
}

export interface Position {
  x: number;
  y: number;
}

export type ContextMenuState = {
    position: Position;
    type: 'create';
    source: { blockId: string; handleId: string };
} | {
    position: Position;
    type: 'insert';
    connectionId: string;
} | null;

export interface BaseBlock {
  id: string;
  type: BlockType;
  position: Position;
}

export interface WelcomeBlock extends BaseBlock {
  type: BlockType.Welcome;
  data: {
    message: string;
  };
}

export interface MessageBlock extends BaseBlock {
  type: BlockType.Message;
  data: {
    message: string;
  };
}

export interface GoodbyeBlock extends BaseBlock {
  type: BlockType.Goodbye;
  data: {
    message: string;
  };
}

export interface QuestionBlock extends BaseBlock {
  type: BlockType.Question;
  data: {
    message: string;
    variableName?: string;
  };
}

export interface ButtonOption {
    id: string;
    text: string;
}

export interface ButtonsBlock extends BaseBlock {
  type: BlockType.Buttons;
  data: {
    message: string;
    options: ButtonOption[];
    variableName?: string;
  };
}

export interface FieldBlock extends BaseBlock {
  type: BlockType.Field;
  data: {
    variableName: string;
  };
}

export type Block = WelcomeBlock | QuestionBlock | ButtonsBlock | FieldBlock | MessageBlock | GoodbyeBlock;

export interface Connection {
    id:string;
    source: {
        blockId: string;
        handleId: string;
    };
    target: {
        blockId: string;
        handleId: string;
    };
}