import React from 'react';
import MatchingHeadings from './MatchingHeadings';
import TrueFalseNotGiven from './TrueFalseNotGiven';
import MultipleChoice from './MultipleChoice';
import GapFill from './GapFill';

const TestingBodyRenderQuestion = React.memo(({
    testData,
    answers,
    onHandleAnswerChange,
    isSubmitted
}) => {

    if (!testData || !testData.questions_json) {
        return (
            <div className="p-10 text-center text-slate-500">
                Đang tải câu hỏi...
            </div>
        );
    }

    return (
        <>
            {testData.questions_json.map(group => {
                const props = {
                    group,
                    answers,
                    onAnswerChange: onHandleAnswerChange,
                    isSubmitted
                };

                switch (group.type) {
                    case 'matching_headings':
                        return <MatchingHeadings key={group.id} {...props} />;
                    case 'true_false_not_given':
                        return <TrueFalseNotGiven key={group.id} {...props} />;
                    case 'multiple_choice':
                        return <MultipleChoice key={group.id} {...props} />;
                    case 'gap_fill':
                        return <GapFill key={group.id} {...props} />;
                    default:
                        return (
                            <div key={group.id} className="p-4 bg-amber-50 rounded">
                                Unknown question type
                            </div>
                        );
                }
            })}
        </>
    );
});

export default TestingBodyRenderQuestion;