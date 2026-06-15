import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { fs, sw, sh } from '../../utils/responsive';
import { Images } from '../../assets/images';
import { BASE_URL } from '../../constants/api';
import { CartItem } from '../../services/api/cart';

interface CartItemCardProps {
  item: CartItem;
  colors: any;
  onIncrease: () => void;
  onDecrease: () => void;
  onDelete: () => void;
}

export default function CartItemCard({
  item,
  colors,
  onIncrease,
  onDecrease,
  onDelete,
}: CartItemCardProps) {
  return (
    <View style={[styles.container, { borderBottomColor: colors.borderSubtle }]}>
      <Image
        source={{ uri: `${BASE_URL}${item.image}` }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.darkBrown, fontFamily: colors.fontInterMedium }]} numberOfLines={1}>
              {item.product_name}
            </Text>
            <Text style={[styles.category, { color: colors.text, fontFamily: colors.fontInterRegular ,opacity:0.5}]}>
              {item.department?.name_en}
            </Text>
          </View>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Image source={Images.trash} style={styles.trashIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <View style={[styles.quantityContainer, { borderColor: colors.offWhite, backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={onDecrease} style={styles.qtyBtn}>
              <Text style={[styles.qtyControlText, { color: colors.lightBrown }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.text, fontFamily: colors.fontSemiBold }]}>
              {item.quantity}
            </Text>
            <TouchableOpacity onPress={onIncrease} style={styles.qtyBtn}>
              <Text style={[styles.qtyControlText, { color: colors.lightBrown }]}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.price, { color: colors.text, fontFamily: colors.fontSemiBold }]}>
            {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} QAR
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: sh(16),
    borderBottomWidth: 1,
  },
  image: {
    width: sw(80),
    height: sw(80),
    borderRadius: sw(12),
    backgroundColor: '#F5F5F5',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: sw(16),
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: sw(8),
  },
  title: {
    fontSize: fs(15),
  },
  category: {
    fontSize: fs(12),
    marginTop: sh(2),
  },
  deleteButton: {
    padding: sw(4),
  },
  trashIcon: {
    width: sw(18),
    height: sw(18),
    resizeMode: 'contain',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: sw(20),
    paddingHorizontal: sw(8),
    paddingVertical: sh(4),
    borderWidth: 1,
  },
  qtyBtn: {
    paddingHorizontal: sw(8),
  },
  qtyControlText: {
    fontSize: fs(18),
    fontWeight: '500',
  },
  qtyText: {
    fontSize: fs(14),
    marginHorizontal: sw(8),
  },
  price: {
    fontSize: fs(14),
  },
});
