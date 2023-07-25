import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LunarFloreSwap {

    // Address of the custom ERC20 token and USDC contracts on Polygon
    address public floreAddress;
    uint public col;
    address public baseAddress;

    // Address of the contract owner
    address public owner;

    // Constructor to set the token addresses and contract owner
    constructor(address _floreTokenAddress, address _usdcAddress, uint _col) {
        floreAddress = _floreTokenAddress;
        col = _col;
        baseAddress = _usdcAddress;
        owner = msg.sender;
    }

    // Function to allow the contract owner to update the base swap
    function updateBase(address _baseCurrency, uint _col) external {
        require(msg.sender == owner, "Only the owner can update base");
        baseAddress = _baseCurrency;
        col = _col;
    }

    // Function to allow the contract owner to withdraw any accidentally sent ERC20 tokens
    function withdrawTokens(address tokenAddress, uint256 amount) external {
        require(msg.sender == owner, "Only the owner can withdraw tokens");
        IERC20(tokenAddress).transfer(owner, amount);
    }

    // Function to allow the contract owner to withdraw any accidentally sent ERC20 tokens
    function withdrawBase(uint256 amount) external {
        require(msg.sender == owner, "Only the owner can withdraw tokens");
        IERC20(baseAddress).transfer(owner, amount);
    }

    // Function to perform the token swap (note: requires approval of token)
    function swapTokens(uint256 amount) external {
        // Ensure the contract has enough custom ERC20 tokens to swap
        IERC20 flore = IERC20(floreAddress);
        require(flore.balanceOf(address(this)) >= amount, "Insufficient custom tokens in the contract");
        // Transfer the custom tokens from the contract to this contract's caller
        flore.transfer(msg.sender, amount);
        IERC20 base = IERC20(baseAddress);
        base.transfer(address(this), amount / col);
    }
}