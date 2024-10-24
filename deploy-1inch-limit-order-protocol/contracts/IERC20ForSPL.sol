// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IERC20ForSPL {
    function approve(address spender, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address) external view returns (uint);
}
