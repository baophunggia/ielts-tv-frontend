import React from 'react';
import MatchingHeadings from './MatchingHeadings';
import TrueFalseNotGiven from './TrueFalseNotGiven';
import MultipleChoice from './MultipleChoice';
import GapFill from './GapFill';
import MatchingInformation from './MatchingInformation';
import MatchingFeatures from './MatchingFeatures';
import MultipleChoiceMulti from './MultipleChoiceMulti';

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
                // FIX BUG: Bỏ qua các nhóm câu hỏi rỗng (không có câu hỏi nào bên trong)
                // để tránh crash trắng trang khi group.questions[0] bị undefined
                if (!group.questions || group.questions.length === 0) {
                    return (
                        <div key={group.id} className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                            Nhóm câu hỏi "{(group.type || '').replace(/_/g, ' ')}" đang trống, vui lòng liên hệ giáo viên để kiểm tra lại đề thi.
                        </div>
                    );
                }

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
                    case 'matching_information':
                        return <MatchingInformation key={group.id} {...props} />;
                    case 'matching_features':
                        return <MatchingFeatures key={group.id} {...props} />;
                    case 'multiple_choice_multi':
                        return <MultipleChoiceMulti key={group.id} {...props} />;
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