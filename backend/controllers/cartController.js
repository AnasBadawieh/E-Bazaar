const asyncHandler = require('express-async-handler');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('cartItems.product');
  if (cart) {
    res.json(cart);
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
});

// @desc    Add items to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;
  const user = req.user._id;

  // Filter out invalid items
  const validCartItems = cartItems.filter(item => 
    item.product && item.price && item.image && item.qty && item.name
  );
  try {
    let cart = await Cart.findOne({ user });

    if (cart) {
      // Update existing cart
      cart.cartItems = validCartItems;
    } else {
      // Create new cart
      cart = new Cart({
        user,
        cartItems: validCartItems
      });
      await cart.save();

      // Update user's cart reference
      const userDoc = await User.findById(user);
      userDoc.cart = cart._id;
      await userDoc.save();
    }

    await cart.save();
    res.status(201).json({ message: 'Cart updated', cart });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:id
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.cartItems = cart.cartItems.filter((x) => x.product.toString() !== req.params.id);
    await cart.save();
    res.json(cart);
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    const cartItem = cart.cartItems.find((item) => item.product.toString() === req.params.id);

    if (cartItem) {
      cartItem.qty = qty;
      await cart.save();
      res.json(cartItem);
    } else {
      res.status(404);
      throw new Error('Cart item not found');
    }
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
});


module.exports = {
  updateCartItem,
  addToCart,
  removeFromCart,
  getCart,
};