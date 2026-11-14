import { useEffect, useRef } from 'react';

export default function ChatInput({
  value,
  onChange,
  placeholder = "Type your response...",
  onSubmit,
  disabled = false,
  quickReplies = [],
  onQuickReplySelect,
  inputType = "text",
  min,
  max,
  step
}) {
  const inputRef = useRef(null);

  // Auto-focus input when enabled or when placeholder/inputType changes
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, placeholder, inputType]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit(value);
      }
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit(value);
    }
  };

  return (
    <div className="chat-input-wrapper-inner" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Quick Reply Pills */}
      {quickReplies.length > 0 && (
        <div className="quick-replies-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          {quickReplies.map((qr) => (
            <button
              key={typeof qr === 'object' ? qr.value : qr}
              type="button"
              className="pill-role"
              onClick={() => onQuickReplySelect(qr)}
              disabled={disabled}
            >
              {typeof qr === 'object' ? qr.label : qr}
            </button>
          ))}
        </div>
      )}

      {/* Input Field and Send Button */}
      {inputType !== 'custom' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type={inputType}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "NeuroVision is typing..." : placeholder}
            disabled={disabled}
            style={{
              flex: 1,
              background: 'rgba(15, 0, 32, 0.6)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 14px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <button
            type="button"
            onClick={handleSendClick}
            disabled={disabled || !value.trim()}
            className="btn-submit"
            style={{
              padding: '11px 20px',
              borderRadius: 'var(--radius-sm)',
              whiteSpace: 'nowrap',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              opacity: disabled || !value.trim() ? 0.5 : 1,
              cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
