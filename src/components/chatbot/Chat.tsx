"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Icon, Textfield } from "xtreme-ui";
import { useChat } from "../../utils/hooks/useChat";
import { useResize } from "../../utils/hooks/useResize";
import { useRestaurant } from "../context/useContext";
import { ChatFab } from "./ChatFab";

import "./chat.scss";
import { MessageList } from "./MessageList";

export const ChatInterface = () => {
	const session = useSession();
	const { restaurant, loading } = useRestaurant();
	const isAuthenticated = session.status === "authenticated";

	const { isOpen, messages, isLoading, sendMessage, toggleOpen, resetChat, messagesEndRef, chatRef } = useChat({
		restaurantId: restaurant?.username ?? "",
		isAuthenticated,
	});

	const { dimensions, handleResizeStart } = useResize({
		initialWidth: 500,
		initialHeight: 700,
		minWidth: 350,
		minHeight: 450,
		maxWidth: 640,
		maxHeight: 950,
	});

	const [input, setInput] = useState("");

	return (
		<>
			{!loading && <ChatFab isOpen={isOpen} toggleOpen={toggleOpen} resetChat={resetChat} isAuthenticated={isAuthenticated} />}
			<div
				ref={chatRef}
				className={`chatWidget ${isOpen ? "open" : ""}`}
				style={{
					width: `${dimensions.width}px`,
					height: `${dimensions.height}px`,
				}}>
				<div className="chatHeader">
					<div className="chatHeaderContent">
						<div className="chatAvatar">
							<Icon code="f544" set="duotone" type="solid" size={28} />
						</div>
					</div>
				</div>
				<MessageList messages={messages} isLoading={isLoading} bottomRef={messagesEndRef} onResizeStart={handleResizeStart} />
				<Textfield
					value={input}
					className="chatInput"
					placeholder="Ask Jarvis about food, recommendations, prices..."
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
					onKeyDown={(e: React.KeyboardEvent) => {
						if (e.key === "Enter" && input.trim() && !isLoading) {
							sendMessage(input);
							setInput("");
						}
					}}
				/>
			</div>
		</>
	);
};
