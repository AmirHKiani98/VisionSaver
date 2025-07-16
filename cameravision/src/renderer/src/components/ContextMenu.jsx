import React, { useState, useRef } from 'react';
import { Menu, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';

// Usage: <ContextMenu menuItems={[...]} contextMenuId="some-id"> <AnyComponent/> </ContextMenu>
const ContextMenu = React.forwardRef(({ menuItems, children, className, contextMenuId }, ref) => {
    const [menuState, setMenuState] = useState({ open: false, mouseX: null, mouseY: null });
    const containerRef = useRef(null);

    const handleContextMenu = (event) => {
        event.preventDefault();
        setMenuState({
            open: true,
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
        });
    };

    const handleClose = () => {
        setMenuState({ ...menuState, open: false });
    };

    return (
        <div
            ref={containerRef}
            className={className || ""}
            onContextMenu={handleContextMenu}
            style={{ display: 'inline-block', width: '100%' }}
            data-context-menu-id={contextMenuId || 'context-menu'}
        >
            {children}
            <Menu
                open={menuState.open}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    menuState.mouseY !== null && menuState.mouseX !== null
                        ? { top: menuState.mouseY, left: menuState.mouseX }
                        : undefined
                }            >
                {menuItems && menuItems.map((item, idx) => (
                    <MenuItem key={item.label || idx} onClick={() => { item.action && item.action(); handleClose(); }}>
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
});

/** @type {import('react').ForwardRefExoticComponent<{
    menuItems: Array<{ label: React.ReactNode, onClick?: () => void }>,
    children: React.ReactNode,
    className?: string,
    contextMenuId?: string
} & React.RefAttributes<HTMLDivElement>>} */

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;