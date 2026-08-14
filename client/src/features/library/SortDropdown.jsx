import SelectDropdown from "../../components/ui/SelectDropdown";

const SortDropdown = ({ options, value, onChange }) => (
  <SelectDropdown
    options={options}
    value={value}
    onChange={onChange}
    caption="Sort"
  />
);

export default SortDropdown;
