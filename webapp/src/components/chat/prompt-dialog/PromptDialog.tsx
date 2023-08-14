// Copyright (c) Microsoft. All rights reserved.

import {
    Body1Strong,
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Label,
    Link,
    SelectTabEventHandler,
    Tab,
    TabList,
    TabValue,
    Tooltip,
    makeStyles,
    shorthands,
    tokens,
} from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import React from 'react';
import { Constants } from '../../../Constants';
import { BotResponsePrompt, PromptSectionsNameMap } from '../../../libs/models/BotResponsePrompt';
import { IChatMessage } from '../../../libs/models/ChatMessage';
import { useDialogClasses } from '../../../styles';
import { TokenUsageGraph } from '../../token-usage/TokenUsageGraph';
import { formatParagraphTextContent } from '../../utils/TextUtils';
import { StepwiseThoughtProcess } from './stepwise-planner/StepwiseThoughtProcess';

const useClasses = makeStyles({
    prompt: {
        marginTop: tokens.spacingHorizontalS,
    },
    infoButton: {
        ...shorthands.padding(0),
        ...shorthands.margin(0),
        minWidth: 'auto',
        marginLeft: 'auto', // align to right
    },
});

interface IPromptDialogProps {
    message: IChatMessage;
}

export const PromptDialog: React.FC<IPromptDialogProps> = ({ message }) => {
    const classes = useClasses();
    const dialogClasses = useDialogClasses();

    const [selectedTab, setSelectedTab] = React.useState<TabValue>('formatted');
    const onTabSelect: SelectTabEventHandler = (_event, data) => {
        setSelectedTab(data.value);
    };

    let prompt: string | BotResponsePrompt;
    try {
        prompt = JSON.parse(message.prompt ?? '{}') as BotResponsePrompt;
    } catch (e) {
        prompt = message.prompt ?? '';
    }

    let promptDetails;
    if (typeof prompt === 'string') {
        promptDetails = formatParagraphTextContent(prompt);
    } else {
        promptDetails = Object.entries(prompt).map(([key, value]) => {
            const isStepwiseThoughtProcess = Constants.STEPWISE_RESULT_NOT_FOUND_REGEX.test(value as string);
            if (
                key === 'chatMemories' &&
                value &&
                !(value as string).includes('User has also shared some document snippets:')
            ) {
                value += '\nNo relevant document memories.';
            }
            return value && key !== 'rawContent' ? (
                <div className={classes.prompt} key={`prompt-details-${key}`}>
                    <Body1Strong>{PromptSectionsNameMap[key]}</Body1Strong>
                    {isStepwiseThoughtProcess ? (
                        <StepwiseThoughtProcess stepwiseResult={value as string} />
                    ) : (
                        formatParagraphTextContent(value as string)
                    )}
                </div>
            ) : null;
        });
    }

    return (
        <Dialog>
            <DialogTrigger disableButtonEnhancement>
                <Tooltip content={'Show prompt'} relationship="label">
                    <Button className={classes.infoButton} icon={<Info16Regular />} appearance="transparent" />
                </Tooltip>
            </DialogTrigger>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>Prompt</DialogTitle>
                    <DialogContent>
                        <TokenUsageGraph promptView tokenUsage={message.tokenUsage ?? {}} />
                        {message.prompt && (
                            <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
                                <Tab data-testid="formatted" id="formatted" value="formatted">
                                    Formatted
                                </Tab>
                                <Tab data-testid="rawContent" id="rawContent" value="rawContent">
                                    Raw Content
                                </Tab>
                            </TabList>
                        )}
                        {selectedTab === 'formatted' && promptDetails}
                        {selectedTab === 'rawContent' &&
                            formatParagraphTextContent((prompt as BotResponsePrompt).rawContent)}
                    </DialogContent>
                    <DialogActions position="start" className={dialogClasses.footer}>
                        <Label size="small" color="brand">
                            Want to learn more about prompts? Click{' '}
                            <Link href="https://aka.ms/sk-about-prompts" target="_blank" rel="noreferrer">
                                here
                            </Link>
                            .
                        </Label>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">Close</Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
