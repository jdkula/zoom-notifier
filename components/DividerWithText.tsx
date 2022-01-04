import { FC } from 'react';
import styled from '@emotion/styled';

const DividerContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(1)}px ${({ theme }) => theme.spacing(2)}px;
`;
const DividerContent = styled.span`
    padding: ${({ theme }) => theme.spacing(1)}px;
    color: lightgray;
`;
const Border = styled.div`
    flex-grow: 1;
    height: 1px;
    background-color: lightgray;
`;

const DividerWithText: FC = ({ children }) => (
    <DividerContainer>
        <Border />
        <DividerContent>{children}</DividerContent>
        <Border />
    </DividerContainer>
);

export default DividerWithText;
