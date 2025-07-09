function RecordLogIndicator({ color, percentage }) {
  return (
    <div className={`absolute bottom-3 left-[${percentage}] transform -translate-x-1/2 h-10 w-10 z-50 flex flex-col items-center`}>
              <div className={`flex w-10 h-7 ${color}`}>
              </div>
              <div
      className='!w-3'
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid #f1f1f1'
          }}
          />
    </div>
  )
}

export default RecordLogIndicator;