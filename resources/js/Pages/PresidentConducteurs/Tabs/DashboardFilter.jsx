import React, { useId } from 'react';
import Select2Single from '../../../Components/Select2Single';

export default function DashboardFilter({ children, value, onChange, style, disabled, name, id }) {
    const generatedId = useId();
    const options = React.Children.toArray(children).filter(React.isValidElement).map(option => ({
        value: option.props.value ?? '', label: React.Children.toArray(option.props.children).join(''),
    }));
    return <div style={{ minWidth: 180, ...style }}><Select2Single id={id || generatedId} name={name} value={value} onChange={onChange} options={options} disabled={disabled} isClearable={false} allowClearOption={false} placeholder="Sélectionner un filtre" /></div>;
}
