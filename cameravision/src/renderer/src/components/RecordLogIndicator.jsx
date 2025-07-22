import ContextMenu from "./ContextMenu";
import react from "react";

function RecordLogIndicator({ color, percentage, id, onRemove, time }) {
  
  const [recordLogId, setRecordLogId] = react.useState(id);
  const [env, setEnv] = react.useState(null);
  react.useEffect(() => {
          window.env.get().then(setEnv);
  }, []);

  const menuItems = [
    {
      label: 'Remove log',
      action: onRemove
    }
  ];

  return (
    <ContextMenu className="!absolute" menuItems={menuItems}>
      <div onDoubleClick={onRemove} className={`absolute bottom-3 opacity-10 transform -translate-x-1/2 h-10 w-10 z-50 flex flex-col items-center transition-all duration-300 ease-in-out hover:scale-[1.5] hover:bottom-8 hover:opacity-100`}
        style={{
          left: `${percentage}%`,
        }}>
        <div className={`flex flex-row items-center gap-1 ${color} p-2.5 rounded-lg select-none`}>
          <p className="text-sm select-none">{time}</p>
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
    </ContextMenu>
  )
}

export default RecordLogIndicator;