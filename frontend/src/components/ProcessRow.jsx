function ProcessRow({ pid, name, cpu, mem }) {
  
  const getCpuColor = (val) => {
    if (val > 80) return 'var(--red)';
    if (val > 40) return 'var(--yellow)';
    return 'var(--green)';
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr 1fr',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border)',
    fontSize: '14px',
    color: 'var(--text-primary)'
  };

  return (
    <div style={rowStyle}>
      <div style={{ color: 'var(--text-muted)' }}>{pid}</div>
      <div style={{ fontWeight: '500' }}>{name}</div>
      <div style={{ color: getCpuColor(cpu), fontWeight: 'bold' }}>{cpu}%</div>
      <div>{mem}%</div>
    </div>
  );
}

export default ProcessRow;
