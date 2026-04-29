/**
 * カートパネル
 * 右下に浮くカートボタン + スライドアップのカート一覧
 * Stripe決済への導線を含む
 */
import type { CartItem } from './ShopModal'

interface CartPanelProps {
  items: CartItem[]
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
  onClose: () => void
}

export default function CartPanel({ items, onUpdateQty, onRemove, onCheckout, onClose }: CartPanelProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <div className="cart-panel" id="cart-panel">
      {/* ヘッダー */}
      <div className="cart-panel-header">
        <span className="cart-panel-title">🛒 カート</span>
        <span className="cart-panel-count">{items.length}点</span>
        <button className="cart-panel-close" onClick={onClose}>✕</button>
      </div>

      {/* カート内容 */}
      <div className="cart-panel-items">
        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-emoji">🛒</div>
            <div className="cart-empty-text">カートが空です</div>
          </div>
        ) : (
          items.map(item => (
            <div key={item.product.id} className="cart-item">
              {/* 商品イメージ */}
              <div
                className="cart-item-img"
                style={{ background: `${item.product.imageColor}33` }}
              >
                <span>{item.product.imageEmoji}</span>
              </div>

              {/* 商品情報 */}
              <div className="cart-item-info">
                <div className="cart-item-shop">{item.shop.name}</div>
                <div className="cart-item-name">{item.product.name}</div>
                <div className="cart-item-price">¥{(item.product.price * item.quantity).toLocaleString()}</div>
              </div>

              {/* 数量コントロール */}
              <div className="cart-item-qty">
                <button
                  className="cart-qty-btn"
                  onClick={() => onUpdateQty(item.product.id, -1)}
                >−</button>
                <span className="cart-qty-num">{item.quantity}</span>
                <button
                  className="cart-qty-btn"
                  onClick={() => onUpdateQty(item.product.id, 1)}
                >＋</button>
                <button
                  className="cart-remove-btn"
                  onClick={() => onRemove(item.product.id)}
                >🗑</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* フッター（合計 + 決済ボタン） */}
      {items.length > 0 && (
        <div className="cart-panel-footer">
          <div className="cart-total-row">
            <span className="cart-total-label">合計</span>
            <span className="cart-total-price">¥{total.toLocaleString()}</span>
          </div>
          <div className="cart-checkout-note">
            ※配送料は別途かかります
          </div>
          <button
            className="cart-checkout-btn"
            id="cart-checkout-btn"
            onClick={onCheckout}
          >
            💳 Stripeで購入する
          </button>
          <button
            className="cart-checkout-btn cart-checkout-btn--paypay"
            id="cart-checkout-paypay-btn"
            onClick={onCheckout}
          >
            🟡 PayPayで支払う
          </button>
          <div className="cart-secure-note">🔒 決済はStripe / PayPayのセキュアな環境で処理されます</div>
        </div>
      )}
    </div>
  )
}

/* ===========================
   カートフローティングボタン
   =========================== */
interface CartFabProps {
  count: number
  onClick: () => void
}

export function CartFab({ count, onClick }: CartFabProps) {
  return (
    <button className="cart-fab" id="cart-fab" onClick={onClick}>
      🛒
      {count > 0 && (
        <span className="cart-fab-badge">{count}</span>
      )}
    </button>
  )
}
